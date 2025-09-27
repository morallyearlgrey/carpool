'use client';

import React, { useRef, useState } from 'react';
import Script from 'next/script';

interface MapComponentProps {
  onRouteSelected?: (route: { start: google.maps.LatLng; end: google.maps.LatLng }) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onRouteSelected }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const infoBoxRef = useRef<HTMLDivElement | null>(null);

  const [startInput, setStartInput] = useState('');
  const [endInput, setEndInput] = useState('');

  const initMap = () => {
    if (!mapRef.current) return;

    const googleMap = new google.maps.Map(mapRef.current, {
      center: { lat: 28.6024, lng: -81.3109 },
      zoom: 12,
    });

    const directionsRenderer = new google.maps.DirectionsRenderer({ suppressMarkers: true });
    directionsRenderer.setMap(googleMap);
    directionsRendererRef.current = directionsRenderer;

    const geocoder = new google.maps.Geocoder();

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

    const updateInputFromMarker = (marker: google.maps.Marker, label: 'Start' | 'End') => {
      geocoder.geocode({ location: marker.getPosition()! }, (results) => {
        const address = results?.[0]?.formatted_address || marker.getPosition()!.toUrlValue();
        if (label === 'Start') setStartInput(address);
        else setEndInput(address);
      });
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
            onRouteSelected?.({ start, end });
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

      // Update input on drag
      marker.addListener('dragend', () => {
        updateInputFromMarker(marker, label);
        if (markersRef.current.length === 2) {
          drawRoute(markersRef.current[0].getPosition()!, markersRef.current[1].getPosition()!);
        }
      });

      markersRef.current.push(marker);
      updateInputFromMarker(marker, label);

      if (markersRef.current.length === 2) {
        drawRoute(markersRef.current[0].getPosition()!, markersRef.current[1].getPosition()!);
      }
    };

    // Map click listener
    googleMap.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;

      if (markersRef.current.length >= 2) {
        markersRef.current.forEach((m) => m.setMap(null));
        markersRef.current = [];
        directionsRenderer.setDirections({ routes: [] } as google.maps.DirectionsResult);
        infoBoxRef.current!.innerText = '';
        setStartInput('');
        setEndInput('');
        return;
      }

      const label: 'Start' | 'End' = markersRef.current.length === 0 ? 'Start' : 'End';
      addMarker(e.latLng, label);
    });

    // Autocomplete inputs
    const startInputEl = document.getElementById('start-input') as HTMLInputElement;
    const endInputEl = document.getElementById('end-input') as HTMLInputElement;

    if (startInputEl) {
      const autocompleteStart = new google.maps.places.Autocomplete(startInputEl);
      autocompleteStart.addListener('place_changed', () => {
        const place = autocompleteStart.getPlace();
        if (!place.geometry) return;
        if (markersRef.current[0]) markersRef.current[0].setMap(null), markersRef.current.shift();
        addMarker(place.geometry.location, 'Start');
      });
    }

    if (endInputEl) {
      const autocompleteEnd = new google.maps.places.Autocomplete(endInputEl);
      autocompleteEnd.addListener('place_changed', () => {
        const place = autocompleteEnd.getPlace();
        if (!place.geometry) return;
        if (markersRef.current[1]) markersRef.current[1].setMap(null), markersRef.current.pop();
        addMarker(place.geometry.location, 'End');
      });
    }
  };

  return (
    <>
      <div className="flex gap-2 mb-2">
        <input
          id="start-input"
          className="inputs flex-1"
          placeholder="Enter start location"
          value={startInput}
          onChange={(e) => setStartInput(e.target.value)}
        />
        <input
          id="end-input"
          className="inputs flex-1"
          placeholder="Enter end location"
          value={endInput}
          onChange={(e) => setEndInput(e.target.value)}
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
