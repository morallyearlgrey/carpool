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

  // Updated handleOpenRideForm function for the dashboard
// In your dashboard page.tsx, replace the handleOpenRideForm function:

const handleOpenRideForm = async (mode: 'request' | 'offer') => {
  if (mode === 'request') {
    // Handle immediate request processing
    if (!start || !end) {
      alert('Please select both start and end locations on the map first.');
      return;
    }

    setSearchLoading(true);
    
    try {
      const userId = (session as any)?.user?.id || (session as any)?.user?.email || '';
      
      const requestPayload = {
        userId,
        beginLocation: { lat: start.latLng.lat(), long: start.latLng.lng() },
        finalLocation: { lat: end.latLng.lat(), long: end.latLng.lng() },
        date: new Date().toISOString().split('T')[0],
        startTime: '08:00', // You can make these dynamic later
        finalTime: '09:00'
      };

      // First, try to find matching rides
      const ridesRes = await fetch('/api/recommendations', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...requestPayload, mode: 'rides' }),
      });

      const ridesData = await ridesRes.json();
      const rideMatches = ridesData.candidates || [];

      let requestSent = false;

      if (rideMatches.length > 0) {
        // Send request to the best matching ride
        const bestMatch = rideMatches[0];
        const sendRes = await fetch('/api/requests/send', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            ...requestPayload,
            userId: session?.user.id,
            driverId: bestMatch.driver._id,
            rideId: bestMatch.rideId,
            requestReceiver: bestMatch.driver._id
          }),
        });

        if (sendRes.ok) {
          setRequestResults(rideMatches);
          requestSent = true;
        }
      }

      if (!requestSent) {
        // Try schedule-based matching
        const scheduleRes = await fetch('/api/recommendations', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ...requestPayload, mode: 'schedules' }),
        });

        const scheduleData = await scheduleRes.json();
        const scheduleMatches = scheduleData.candidates || [];

        if (scheduleMatches.length > 0) {
          const bestScheduleMatch = scheduleMatches[0];
          const sendRes = await fetch('/api/requests/send', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
              ...requestPayload,
              driverId: bestScheduleMatch.driver._id,
              requestReceiver: bestScheduleMatch.driver._id
            }),
          });

          if (sendRes.ok) {
            setRequestResults(scheduleMatches);
            requestSent = true;
          }
        }
      }

      if (!requestSent) {
        // No matches - post publicly
        await fetch('/api/requests/public', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(requestPayload),
        });
        setRequestResults([]);
      }

    } catch (error) {
      console.error('Error processing ride request:', error);
      alert('Error processing your request. Please try again.');
    } finally {
      setSearchLoading(false);
    }
  }
  
  // Always open the form for further details/confirmation
  setRideMode(mode);
  setIsRequestOpen(true);
};

// You might also want to add a success message state:
const [successMessage, setSuccessMessage] = useState<string | null>(null);

// And display it in your JSX:
{successMessage && (
  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
    {successMessage}
  </div>
)}
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
      {/* MIDDLE COLUMN */}
        <div className={`lg:col-span-1 flex p-6 flex-col items-center gap-8 h-full ${animationClasses('200ms')}`}>
          {isRequestOpen ? (
            <div className="relative bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 w-full flex-grow">
              {/* X Close Button */}
              <button
                onClick={async () => {
                  if (searchLoading) {
                    // Cancel pending request on backend if one exists
                    try {
                      await fetch('/api/requests/cancel', {
                        method: 'DELETE',
                        headers: { 'content-type': 'application/json' },
                        body: JSON.stringify({
                          userId: (session as any)?.user?.id || (session as any)?.user?.email || '',
                        }),
                      });
                    } catch (err) {
                      console.error('Cancel request failed', err);
                    }
                  }
                  setIsRequestOpen(false);
                  setRideMode('request');
                  setSearchLoading(false);
                  setRequestResults(null);
                }}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-500 text-xl"
              >
                ✕
              </button>

              <h3 className="text-xl font-bold mb-4">
                {rideMode === 'request' ? 'Request a Ride' : 'Offer a Ride'}
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!start || !end) return alert('Please select both start and end locations.');
                  setSearchLoading(true);

                  const form = e.target as HTMLFormElement;
                  const fd = new FormData(form);
                  const date = fd.get('date') as string;
                  const startTime = fd.get('startTime') as string;
                  const finalTime = fd.get('finalTime') as string;

                  try {
                    if (rideMode === 'request') {
                      // 🔹 Ride Request flow
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

                      if (candidates.length > 0) {
                        setRequestResults(candidates);
                      } else {
                        // No matches → post publicly
                        await fetch('/api/requests/public', {
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
                        setRequestResults([]);
                      }
                    } else if (rideMode === 'offer') {
                      // 🔹 Ride Offer flow
                      await fetch('/api/offers', {
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
                      setRequestResults([]); // you might later show "Offer posted!" instead
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Error sending request. Please try again.');
                    setSearchLoading(false); // allow retry
                  }
                }}
              >
                <input
                  name="beginAddress"
                  value={start?.address || ''}
                  placeholder="Start address"
                  className="inputs mb-2"
                  readOnly
                />
                <input
                  name="finalAddress"
                  value={end?.address || ''}
                  placeholder="End address"
                  className="inputs mb-2"
                  readOnly
                />
                <input
                  type="date"
                  name="date"
                  defaultValue={new Date().toISOString().slice(0, 10)}
                  className="inputs mb-2"
                />
                <input name="startTime" placeholder="08:30" className="inputs mb-2" />
                <input name="finalTime" placeholder="09:00" className="inputs mb-2" />

                {/* Action Buttons / Loader */}
                {!searchLoading ? (
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsRequestOpen(false);
                        setRideMode('request');
                      }}
                      className="px-4 py-2 border rounded"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-600 text-white rounded"
                    >
                      {rideMode === 'request' ? 'Request' : 'Offer'}
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <span className="text-purple-700 font-medium">
                      {rideMode === 'request' ? 'Searching...' : 'Posting...'}
                    </span>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-2 bg-purple-600 animate-pulse w-1/2"></div>
                    </div>
                  </div>
                )}
              </form>


              {/* Results Section */}
              {requestResults && requestResults.length === 0 && (
                <div className="mt-4 text-sm text-gray-600">
                  No matches found... your request has been posted publicly.
                </div>
              )}
              {requestResults && requestResults.length > 0 && (
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
