'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import Script from 'next/script';

interface MapComponentProps {
  onRouteSelected?: (route: {
    start: { latLng: google.maps.LatLng; address: string };
    end: { latLng: google.maps.LatLng; address: string };
  }) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onRouteSelected }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const infoBoxRef = useRef<HTMLDivElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');

  // If the Google Maps script is already present (e.g. loaded by another component),
  // initialize the map on mount. This helps with client-side route transitions.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win: any = window as any;
    if (win.google && win.google.maps && win.google.maps.places) {
      // Defer slightly to ensure DOM refs are ready
      setTimeout(() => {
        try { initMap(); } catch (e) { /* ignore init errors */ }
      }, 0);
    }
  }, []);

  // Helper: Reverse geocode LatLng → address
  const geocodeLatLng = (latLng: google.maps.LatLng, callback: (address: string) => void) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: latLng }, (results) => {
      callback(results && results[0]?.formatted_address ? results[0].formatted_address : '');
    });
  };

  const initMap = useCallback(() => {
    // avoid double-init
    if (directionsRendererRef.current) return;
    if (!mapRef.current) return;

    const googleMap = new google.maps.Map(mapRef.current, {
      center: { lat: 28.6024, lng: -81.3109 },
      zoom: 12,
    });

    const directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    directionsRenderer.setMap(googleMap);
    directionsRendererRef.current = directionsRenderer;

    geocoderRef.current = new google.maps.Geocoder();

    // Info box for drive time & distance
    const infoBox = document.createElement('div');
    infoBox.className =
      'bg-white p-4 rounded-xl shadow-lg font-bold text-gray-800 text-lg min-w-[150px] text-center';
    googleMap.controls[google.maps.ControlPosition.TOP_LEFT].push(infoBox);
    infoBoxRef.current = infoBox;

    const updateInfoBox = (directions?: google.maps.DirectionsResult) => {
      if (!infoBoxRef.current) return;
      if (!directions || directions.routes.length === 0) {
        infoBoxRef.current.innerText = '';
        return;
      }
      const leg = directions.routes[0].legs[0];
      infoBoxRef.current.innerText = `${leg.duration?.text} (${leg.distance?.text})`;
    };

    const drawRoute = (start: google.maps.LatLng, end: google.maps.LatLng) => {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(
        {
          origin: start,
          destination: end,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result);
            updateInfoBox(result);
            if (markersRef.current.length === 2) {
              const [startMarker, endMarker] = markersRef.current;
              geocodeLatLng(startMarker.getPosition()!, (startAddr) => {
                geocodeLatLng(endMarker.getPosition()!, (endAddr) => {
                  setStartAddress(startAddr);
                  setEndAddress(endAddr);
                  onRouteSelected?.({
                    start: { latLng: startMarker.getPosition()!, address: startAddr },
                    end: { latLng: endMarker.getPosition()!, address: endAddr },
                  });
                });
              });
            }
          }
        }
      );
    };

    const addMarker = (position: google.maps.LatLng, label: 'Start' | 'End') => {
      const marker = new google.maps.Marker({
        position,
        map: googleMap,
        label,
        title: label,
        draggable: true,
      });

      marker.addListener('dragend', () => {
        if (markersRef.current.length === 2) {
          drawRoute(markersRef.current[0].getPosition()!, markersRef.current[1].getPosition()!);
        }
      });

      markersRef.current.push(marker);

      if (markersRef.current.length === 2) {
        drawRoute(markersRef.current[0].getPosition()!, markersRef.current[1].getPosition()!);
      } else {
        geocodeLatLng(marker.getPosition()!, (addr) => {
          if (label === 'Start') setStartAddress(addr);
          else setEndAddress(addr);
        });
      }
    };

    // Map click: add markers or reset
    googleMap.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      if (markersRef.current.length >= 2) {
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        directionsRenderer.setDirections({ routes: [] } as unknown as google.maps.DirectionsResult);
        infoBoxRef.current!.innerText = '';
        setStartAddress('');
        setEndAddress('');
        return;
      }
      addMarker(e.latLng, markersRef.current.length === 0 ? 'Start' : 'End');
    });

    // Setup Places Autocomplete
    const startInputEl = document.getElementById('start-input') as HTMLInputElement;
    const endInputEl = document.getElementById('end-input') as HTMLInputElement;

    if (startInputEl) {
      const autocompleteStart = new google.maps.places.Autocomplete(startInputEl);
      autocompleteStart.addListener('place_changed', () => {
        const place = autocompleteStart.getPlace();
        if (!place.geometry) return;

        if (markersRef.current[0]) {
          markersRef.current[0].setMap(null);
          markersRef.current.shift();
        }
        if (place.geometry?.location) {
          addMarker(place.geometry.location, 'Start');
        }
      });
    }

    if (endInputEl) {
      const autocompleteEnd = new google.maps.places.Autocomplete(endInputEl);
      autocompleteEnd.addListener('place_changed', () => {
        const place = autocompleteEnd.getPlace();
        if (!place.geometry) return;

        if (markersRef.current[1]) {
          markersRef.current[1].setMap(null);
          markersRef.current.pop();
        }
        if (place.geometry?.location) {
          addMarker(place.geometry.location, 'End');
        }
      });
    }
  }, [onRouteSelected]);

  // If the Google Maps script is already present (e.g. loaded by another component),
  // initialize the map on mount. This helps with client-side route transitions.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as typeof window & {
      google?: typeof google;
    };
    if (win.google && win.google.maps && win.google.maps.places) {
      // Defer slightly to ensure DOM refs are ready
      setTimeout(() => {
        try { initMap(); } catch {
          /* ignore init errors */
        }
      }, 0);
    }
  }, [initMap]);

  return (
    <>
      <div className="flex gap-2 mb-2">
        <input
          id="start-input"
          className="inputs flex-1"
          placeholder="Enter start location"
          value={startAddress}
          onChange={(e) => setStartAddress(e.target.value)}
        />
        <input
          id="end-input"
          className="inputs flex-1"
          placeholder="Enter end location"
          value={endAddress}
          onChange={(e) => setEndAddress(e.target.value)}
        />
      </div>

      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
        strategy="afterInteractive"
        onLoad={initMap}
      />
      <div ref={mapRef} className="w-full h-[500px] rounded-md border border-white" />
    </>
  );
};

export default MapComponent;
