import React, { useState, useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface PlacesAutocompleteProps {
  onAddressSelect: (address: { lat: number; lng: number; description: string }) => void;
  placeholder?: string;
}

const PlacesAutocompleteInner: React.FC<PlacesAutocompleteProps> = ({ onAddressSelect, placeholder = 'Enter an address' }) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({ debounce: 300 });

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSelect = ({ description }: { description: string }) => async () => {
    setValue(description, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
      onAddressSelect({ lat, lng, description });
    } catch (error) {
      console.error('Error: ', error);
    }
  };

  const renderSuggestions = () =>
    data.map((suggestion) => {
      const {
        place_id,
        structured_formatting: { main_text, secondary_text },
      } = suggestion;

      return (
        <li
          key={place_id}
          onClick={handleSelect(suggestion)}
          className="p-2 cursor-pointer hover:bg-gray-100 rounded"
        >
          <strong>{main_text}</strong> <small>{secondary_text}</small>
        </li>
      );
    });

  return (
    <div className="relative w-full">
      <input value={value} onChange={handleInput} disabled={!ready} placeholder={placeholder} className="w-full p-2 border rounded" />
      {status === 'OK' && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">{renderSuggestions()}</ul>
      )}
    </div>
  );
};

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({ onAddressSelect, placeholder = 'Enter an address' }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win: any = window as any;

    if (win.google && win.google.maps && win.google.maps.places) {
      setLoaded(true);
      return;
    }

    // If a script tag already exists, wait for it
    const existing = Array.from(document.getElementsByTagName('script')).find((s) => s.src && s.src.includes('maps.googleapis.com')) as HTMLScriptElement | undefined;
    if (existing) {
      const onLoad = () => setLoaded(true);
      const onError = () => setError('Failed to load Google Maps API');
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', onError);
      return () => {
        existing.removeEventListener('load', onLoad);
        existing.removeEventListener('error', onError);
      };
    }

    // Otherwise, inject the script ourselves
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!key) {
      setError('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
      return;
    }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = () => setLoaded(true);
    s.onerror = () => setError('Failed to load Google Maps API');
    document.head.appendChild(s);
  }, []);

  if (error) return <div className="text-sm text-red-500">{error}</div>;
  if (!loaded) return <div className="text-sm text-gray-500">Loading Places API...</div>;

  return <PlacesAutocompleteInner onAddressSelect={onAddressSelect} placeholder={placeholder} />;
};

export default PlacesAutocomplete;
