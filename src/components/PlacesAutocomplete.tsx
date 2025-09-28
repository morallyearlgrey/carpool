import React from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';
import { useLoadScript } from '@react-google-maps/api';

interface PlacesAutocompleteProps {
  onAddressSelect: (address: { lat: number; lng: number; description: string }) => void;
  placeholder?: string;
}

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({ onAddressSelect, placeholder = "Enter an address" }) => {
  // Load the Google Maps Places API first. use-places-autocomplete requires the
  // global `google` to be present (window.google.maps.places).
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places'],
  });

  if (loadError) {
    return <div className="text-sm text-red-500">Failed to load Google Maps API</div>;
  }

  if (!isLoaded) {
    return <div className="text-sm text-gray-500">Loading Places API...</div>;
  }

  // Only after the script has loaded do we render the inner component that uses the
  // usePlacesAutocomplete hook. This avoids the runtime error from the library.
  return <PlacesAutocompleteInner onAddressSelect={onAddressSelect} placeholder={placeholder} />;
};

const PlacesAutocompleteInner: React.FC<PlacesAutocompleteProps> = ({ onAddressSelect, placeholder = 'Enter an address' }) => {
  const {
    ready,
    value,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
  });

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
      <input
        value={value}
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
