'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import RecommendedRides from '@/components/RecommendedRides';
import { Navbar } from '@/components/navbar';

// Dynamically import MapComponent so it only renders on the client
const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

// --- SVG Icons ---
const BellIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

const RouteIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="19" r="3" />
    <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H13" />
    <circle cx="18" cy="5" r="3" />
  </svg>
);

const PlusCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

const CarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10H8c0 0-2.7.6-4.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
    <path d="M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
    <path d="M5 11v-4c0-.6.4-1 1-1h12c.6 0 1 .4 1 1v4" />
    <path d="m2 11 3-3" />
    <path d="m22 11-3-3" />
  </svg>
);

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);

  const [showComponent, setShowComponent] = useState(false);

  const [isMounted, setIsMounted] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [rideMode, setRideMode] = useState<'request' | 'offer'>('request'); // track which button was clicked
  const [searchLoading, setSearchLoading] = useState(false);
  const [requestResults, setRequestResults] = useState<any[] | null>(null);

  const [start, setStart] = useState<{ latLng: google.maps.LatLng; address: string } | null>(null);
  const [end, setEnd] = useState<{ latLng: google.maps.LatLng; address: string } | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setShowComponent(true);
  }, []);

  const animationClasses = (delay: string) =>
    `transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  const handleOpenRideForm = (mode: 'request' | 'offer') => {
    setRideMode(mode);
    setIsRequestOpen(true);
  };

  // Handle deleting a request
  const handleRequestDelete = async (id: string | null) => {
    if (!id) return alert("No ride selected to cancel");
    if (!confirm('Are you sure you want to cancel this ride?')) return;

    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete ride');

      setRequestResults(null);
      if (currentRideId === id) setCurrentRideId(null);

      setIsRequestOpen(false);
      setSearchLoading(false);
      setRideMode('request');
    } catch (err) {
      console.error('Failed to delete request', id, err);
      alert('Failed to cancel ride. Please try again.');
    }
  };

  // Handle deleting an offer
  const handleOfferDelete = async (id: string | null) => {
    if (!id) return alert("No offer selected to cancel");
    if (!confirm('Are you sure you want to cancel this offer?')) return;

    try {
      const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete offer');

      // Clear frontend state if needed
      if (currentRideId === id) setCurrentRideId(null);

      setIsRequestOpen(false);
      setSearchLoading(false);
      setRideMode('request'); // default back to request
    } catch (err) {
      console.error('Failed to delete offer', id, err);
      alert('Failed to cancel offer. Please try again.');
    }
  };

  // Handle submitting a ride request
  const handleRequestSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!start || !end) return alert('Please select both start and end locations.');
    setSearchLoading(true);

    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const date = fd.get('date') as string;
    const startTime = fd.get('startTime') as string;
    const finalTime = fd.get('finalTime') as string;

    try {
      // POST to recommendations to see if there are matching rides
      const res = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: (session as any)?.user?.id || (session as any)?.user?.email || '',
          mode: 'rides',
          date,
          startTime,
          beginLocation: { lat: start.latLng.lat(), long: start.latLng.lng() },
          finalLocation: { lat: end.latLng.lat(), long: end.latLng.lng() },
        }),
      });

      const data = await res.json();
      const candidates = data.candidates || [];
      let rideId: string | null = null;

      if (candidates.length > 0) {
        setRequestResults(candidates);
        rideId = candidates[0]?._id || null;
      } else {
        // No matches → post publicly
        const publicRes = await fetch('/api/requests/public', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            userId: (session as any)?.user?.id || (session as any)?.user?.email || '',
            beginLocation: { lat: start.latLng.lat(), long: start.latLng.lng() },
            finalLocation: { lat: end.latLng.lat(), long: end.latLng.lng() },
            date,
            startTime,
            finalTime,
          }),
        });

        const publicData = await publicRes.json();
        rideId = publicData.requestId;
        setRequestResults([]);
      }

      setCurrentRideId(rideId);
    } catch (err) {
      console.error(err);
      alert('Error sending request. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };

  // Handle submitting a ride offer
  const handleOfferSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!start || !end) return alert('Please select both start and end locations.');
    setSearchLoading(true);

    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    const date = fd.get('date') as string;
    const startTime = fd.get('startTime') as string;
    const finalTime = fd.get('finalTime') as string;

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: (session as any)?.user?.id || (session as any)?.user?.email || '',
          beginLocation: { lat: start.latLng.lat(), long: start.latLng.lng() },
          finalLocation: { lat: end.latLng.lat(), long: end.latLng.lng() },
          date,
          startTime,
          finalTime,
        }),
      });

      const data = await res.json();
      setCurrentRideId(data.offer?._id || null);
      setRequestResults([]);
    } catch (err) {
      console.error(err);
      alert('Error sending offer. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  };


  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Navbar isLoggedIn={isLoggedIn} />

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
        {/* LEFT COLUMN */}
        <div className={`lg:col-span-1 flex p-6 flex-col gap-8 ${animationClasses('100ms')}`}>
          <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 w-full flex-grow">
            <h2 className="text-2xl font-bold text-[#3a3a5a] mb-4 flex items-center gap-2">
              <BellIcon className="text-[#3a3a5a]" /> Upcoming Rides
            </h2>
            <div className="bg-white bg-opacity-70 rounded-lg min-h-[180px] flex p-4">
              <p className="text-gray-600 text-lg">No upcoming rides scheduled.</p>
            </div>
          </div>

          <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 w-full flex-grow">
            <h2 className="text-2xl font-bold text-[#3a3a5a] mb-4 flex items-center gap-2">
              <RouteIcon className="text-[#3a3a5a]" /> Suggested Rides
            </h2>
            <div className="bg-white bg-opacity-70 rounded-lg min-h-[180px] p-4">
              {isLoggedIn ? (
                <RecommendedRides
                  currentUserId={(session as any)?.user?.id || (session as any)?.user?.email || ''}
                  request={{
                    date: new Date().toISOString(),
                    startTime: '08:30',
                    beginLocation: { lat: 37.77, long: -122.42 },
                    finalLocation: { lat: 37.79, long: -122.39 },
                  }}
                  mode={'schedules'}
                />
              ) : (
                <p className="text-gray-600 text-lg">Sign in to see suggested drivers near your schedule.</p>
              )}
            </div>
          </div>
        </div>

        {/* MIDDLE COLUMN */}
        <div className={`lg:col-span-1 flex p-6 flex-col items-center gap-8 h-full ${animationClasses('200ms')}`}>
          {isRequestOpen ? (
            <div className="relative bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 w-full flex-grow">
              {/* X Close Button */}
              <button
                onClick={() => {
                  if (currentRideId) {
                    if (rideMode === 'request') handleRequestDelete(currentRideId);
                    else if (rideMode === 'offer') handleOfferDelete(currentRideId);
                  } else {
                    setIsRequestOpen(false);
                  }
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
              >
                ✕
              </button>

              <h3 className="text-xl font-bold mb-4">
                {rideMode === 'request' ? 'Request a Ride' : 'Offer a Ride'}
              </h3>

              <form
                onSubmit={(e) => {
                  if (rideMode === 'request') handleRequestSubmit(e);
                  else if (rideMode === 'offer') handleOfferSubmit(e);
                }}
              >
                <input
                  name="beginAddress"
                  value={start?.address || ''}
                  placeholder="Start address"
                  readOnly
                  className="inputs mb-2"
                />
                <input
                  name="finalAddress"
                  value={end?.address || ''}
                  placeholder="End address"
                  readOnly
                  className="inputs mb-2"
                />
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="inputs mb-2"
                />
                <input name="startTime" placeholder="08:30" className="inputs mb-2" />
                <input name="finalTime" placeholder="09:00" className="inputs mb-2" />

                {/* Submit button */}
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded"
                  disabled={searchLoading}
                >
                  {searchLoading
                    ? rideMode === 'request'
                      ? 'Requesting...'
                      : 'Offering...'
                    : rideMode === 'request'
                    ? 'Request'
                    : 'Offer'}
                </button>
              </form>

              {/* Results Section (for requests) */}
              {rideMode === 'request' && requestResults && requestResults.length === 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  No matches found... your request has been posted publicly.
                </div>
              )}
              {rideMode === 'request' && requestResults && requestResults.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold">Found Matches:</h4>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {requestResults.map((r, i) => (
                      <li key={i}>{JSON.stringify(r)}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={() => handleOpenRideForm('request')}
                className="buttons group w-52 h-52 flex items-center justify-center text-white font-bold text-xl transform rotate-45 shadow-2xl shadow-purple-500/40 hover:shadow-purple-400/60 hover:scale-105 transition-all duration-300 ease-in-out my-auto rounded-2xl"
              >
                <span className="transform -rotate-45 text-center flex flex-col items-center gap-2">
                  <PlusCircleIcon className="w-8 h-8 transition-transform duration-300 group-hover:rotate-90" />
                  Request a Ride
                </span>
              </button>

              <button
                onClick={() => handleOpenRideForm('offer')}
                className="buttons group w-52 h-52 flex items-center justify-center text-white font-bold text-xl transform rotate-45 shadow-2xl shadow-purple-500/40 hover:shadow-purple-400/60 hover:scale-105 transition-all duration-300 ease-in-out my-auto rounded-2xl"
              >
                <span className="transform -rotate-45 text-center flex flex-col items-center gap-2">
                  <CarIcon className="w-8 h-8 transition-transform duration-300 group-hover:translate-x-1" />
                  Offer a Ride
                </span>
              </button>
            </>
          )}
        </div>


        {/* RIGHT COLUMN: Map */}
        <div className={`lg:col-span-1 w-full h-[600px] rounded-md pr-5 ${animationClasses('300ms')}`}>
          {showComponent ? (<MapComponent
            onRouteSelected={(route) => {
              setStart(route.start);
              setEnd(route.end);
            }}
          />) : (<></>)}
          
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
