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
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const [startAddress, setStartAddress] = useState('');
  const [endAddress, setEndAddress] = useState('');

  // Helper: Reverse geocode LatLng → address
  const geocodeLatLng = useCallback((latLng: google.maps.LatLng, callback: (address: string) => void) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: latLng }, (results) => {
      callback(results && results[0]?.formatted_address ? results[0].formatted_address : '');
    });
  }, []);

  // Helper: Clear all markers from the map
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
  }, []);

  // Helper: Add a marker to the map
  const addMarker = useCallback((position: google.maps.LatLng, title: string, color = 'red') => {
    if (!directionsRendererRef.current?.getMap()) return null;

    const marker = new google.maps.Marker({
      position,
      map: directionsRendererRef.current.getMap(),
      title,
      icon: {
        url: `https://maps.google.com/mapfiles/ms/icons/${color}-dot.png`,
        scaledSize: new google.maps.Size(32, 32),
      },
    });

    markersRef.current.push(marker);
    return marker;
  }, []);

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

      // Pass duration (in seconds) to parent
      if (onRouteSelected) {
        onRouteSelected(
          {
            start: { latLng: markersRef.current[0].getPosition()!, address: startAddress },
            end: { latLng: markersRef.current[1].getPosition()!, address: endAddress },
          },
          leg.duration?.value // seconds
        );
      }
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
            });
          });
        } else {
          console.error('Directions request failed:', status);
        }
      }
    );
  }, [geocodeLatLng, onRouteSelected]);

  // Handle map clicks
  const handleMapClick = useCallback((clickPosition: google.maps.LatLng) => {
    const markerCount = markersRef.current.length;
    
    if (markerCount === 0) {
      // First click: add start marker
      addMarker(clickPosition, 'Start', 'green');
      geocodeLatLng(clickPosition, (address) => {
        setStartAddress(address);
      });
    } else if (markerCount === 1) {
      // Second click: add end marker and calculate route
      addMarker(clickPosition, 'End', 'red');
      geocodeLatLng(clickPosition, (address) => {
        setEndAddress(address);
      });
      
      const startMarker = markersRef.current[0];
      if (startMarker) {
        calculateAndDisplayRoute(startMarker.getPosition()!, clickPosition);
      }
    } else {
      // Third+ click: reset and start over
      clearMarkers();
      if (directionsRendererRef.current) {
        // Clear directions by setting an empty result
        directionsRendererRef.current.set('directions', null);
      }
      setStartAddress('');
      setEndAddress('');
      
      // Add new start marker
      addMarker(clickPosition, 'Start', 'green');
      geocodeLatLng(clickPosition, (address) => {
        setStartAddress(address);
      });
    }
  }, [addMarker, calculateAndDisplayRoute, clearMarkers, geocodeLatLng]);

  const initMap = useCallback(() => {
    // avoid double-init
    if (directionsRendererRef.current) return;
    if (!mapRef.current) return;

    const googleMap = new google.maps.Map(mapRef.current, {
      center: { lat: 28.6024, lng: -81.3109 },
      zoom: 12,
    });

    directionsRendererRef.current = new google.maps.DirectionsRenderer();
    directionsRendererRef.current.setMap(googleMap);
    geocoderRef.current = new google.maps.Geocoder();

    // Attach click listener
    googleMap.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        handleMapClick(event.latLng);
      }
    });
  }, [handleMapClick]);

  // If the Google Maps script is already present (e.g. loaded by another component),
  // initialize the map on mount. This helps with client-side route transitions.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as typeof window & { google?: typeof google };
    if (win.google && win.google.maps && win.google.maps.places) {
      // Defer slightly to ensure DOM refs are ready
      setTimeout(() => {
        try { initMap(); } catch { /* ignore init errors */ }
      }, 0);
    }
  }, [initMap]);

  const handleScriptLoad = () => {
    initMap();
  };

  return (
    <div className="w-full h-full">
      {/* Info Box */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm">
        <p className="font-semibold text-blue-800">How to use:</p>
        <p className="text-blue-700">Click once to set start, click again to set destination. Click a third time to reset.</p>
        {startAddress && (
          <p className="mt-1 text-green-700">
            <strong>Start:</strong> {startAddress}
          </p>
        )}
        {endAddress && (
          <p className="text-red-700">
            <strong>End:</strong> {endAddress}
          </p>
        )}
      </div>

      {/* Map Container */}
      <div 
        ref={mapRef} 
        className="w-full h-96 border border-gray-300 rounded-md"
        style={{ minHeight: '400px' }}
      />
      <div ref={mapRef} className="w-full h-full rounded-md" />
    </>
  );
};

export default MapComponent;
