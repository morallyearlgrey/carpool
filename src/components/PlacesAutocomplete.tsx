import React, { useEffect, useState } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface PlacesAutocompleteProps {
  onAddressSelect: (address: { lat: number; lng: number; description: string }) => void;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({ onAddressSelect, placeholder = "Enter an address", value, onValueChange }) => {
  // Implement a safe, idempotent loader for the Google Maps Places API. Some
  // other components (e.g. MapComponent) may already inject the script tag; if
  // so we should not inject it again. We also wait for `window.google.maps.places`
  // to be available before rendering the inner autocomplete component.
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const win = window as typeof window & {
      google?: typeof google;
    };

    // If the Places library is already present, we're done.
    if (win.google && win.google.maps && win.google.maps.places) {
      setIsLoaded(true);
      return;
    }

    // If a Google Maps script tag already exists on the page, hook its load event
    // instead of injecting a new one.
    const existing = Array.from(document.getElementsByTagName('script')).find(s => s.src && s.src.includes('maps.googleapis.com')) as HTMLScriptElement | undefined;
    if (existing) {
      if (win.google && win.google.maps && win.google.maps.places) {
        setIsLoaded(true);
        return;
      }
      const onLoad = () => setIsLoaded(true);
      const onError = () => setLoadError('Failed to load Google Maps API');
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', onError);
      return () => {
        existing.removeEventListener('load', onLoad);
        existing.removeEventListener('error', onError);
      };
    }

    // Otherwise, inject the script ourselves (only once).
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
    if (!key) {
      setLoadError('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY');
      return;
    }
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    s.async = true;
    s.defer = true;
    s.onload = () => setIsLoaded(true);
    s.onerror = () => setLoadError('Failed to load Google Maps API');
    document.head.appendChild(s);
    // no cleanup: let the script remain for other components
  }, []);

  if (loadError) {
    return <div className="text-sm text-red-500">{loadError}</div>;
  }

  if (!isLoaded) {
    return <div className="text-sm text-gray-500">Loading Places API...</div>;
  }

  // Only after the script has loaded do we render the inner component that uses the
  // usePlacesAutocomplete hook. This avoids the runtime error from the library.
  return <PlacesAutocompleteInner onAddressSelect={onAddressSelect} placeholder={placeholder} value={value} onValueChange={onValueChange} />;
};

const PlacesAutocompleteInner: React.FC<PlacesAutocompleteProps> = ({ onAddressSelect, placeholder = 'Enter an address', value: externalValue, onValueChange }) => {
  const {
    ready,
    value: internalValue,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
  });

  // Sync external value with internal value
  React.useEffect(() => {
    if (externalValue !== undefined && externalValue !== internalValue) {
      setValue(externalValue, false);
    }
  }, [externalValue, setValue]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onValueChange?.(newValue);
  };

  const handleSelect = ({ description }: { description: string }) => async () => {
    setValue(description, false);
    onValueChange?.(description);
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
      <input
        value={externalValue !== undefined ? externalValue : internalValue}
        onChange={handleInput}
        disabled={!ready}
        placeholder={placeholder}
        className="w-full p-2 border rounded"
      />
      {status === 'OK' && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          {renderSuggestions()}
        </ul>
      )}
    </div>
  );
};

export default PlacesAutocomplete;
