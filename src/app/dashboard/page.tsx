'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import MapComponent from '@/components/MapComponent';
import RecommendedRides from '@/components/RecommendedRides';
import { Navbar } from '@/components/navbar';

// --- SVG Icons ---
const BellIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>
);
const RouteIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="6" cy="19" r="3" /><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H13" /><circle cx="18" cy="5" r="3" /></svg>
);
const PlusCircleIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10" /><path d="M8 12h8" /><path d="M12 8v8" /></svg>
);
const CarIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10H8c0 0-2.7.6-4.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" /><path d="M7 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M17 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" /><path d="M5 11v-4c0-.6.4-1 1-1h12c.6 0 1 .4 1 1v4" /><path d="m2 11 3-3" /><path d="m22 11-3-3" /></svg>
);

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const [isMounted, setIsMounted] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [requestResults, setRequestResults] = useState<any[] | null>(null);

  // Map selections
  const [start, setStart] = useState<{ latLng: google.maps.LatLng; address: string } | null>(null);
  const [end, setEnd] = useState<{ latLng: google.maps.LatLng; address: string } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const animationClasses = (delay: string) =>
    `transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  const handleRequestRide = () => {
    // Autofill inputs with addresses but backend will still use Lat/Lng
    setIsRequestOpen(true);
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
            <div className="bg-white bg-opacity-70 rounded-lg min-h-[180px] flex items-center justify-center p-4">
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
            <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 w-full flex-grow">
              <h3 className="text-xl font-bold mb-4">Request a Ride</h3>
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
                    setRequestResults(candidates.length ? candidates : []);
                  } catch (err) {
                    console.error(err);
                  } finally {
                    setSearchLoading(false);
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
                <input type="date" name="date" defaultValue={new Date().toISOString().slice(0, 10)} className="inputs mb-2" />
                <input name="startTime" placeholder="08:30" className="inputs mb-2" />
                <input name="finalTime" placeholder="09:00" className="inputs mb-2" />
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setIsRequestOpen(false)} className="px-4 py-2 border rounded">
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">
                    {searchLoading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </form>
              {requestResults && requestResults.length === 0 && (
                <div className="mt-4 text-sm text-gray-600">No matches found...</div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={handleRequestRide}
                className="buttons group w-52 h-52 flex items-center justify-center text-white font-bold text-xl transform rotate-45 shadow-2xl shadow-purple-500/40 hover:shadow-purple-400/60 hover:scale-105 transition-all duration-300 ease-in-out my-auto rounded-2xl"
              >
                <span className="transform -rotate-45 text-center flex flex-col items-center gap-2">
                  <PlusCircleIcon className="w-8 h-8 transition-transform duration-300 group-hover:rotate-90" />
                  Request a Ride
                </span>
              </button>
              <button className="buttons group w-52 h-52 flex items-center justify-center text-white font-bold text-xl transform rotate-45 shadow-2xl shadow-purple-500/40 hover:shadow-purple-400/60 hover:scale-105 transition-all duration-300 ease-in-out my-auto rounded-2xl">
                <span className="transform -rotate-45 text-center flex flex-col items-center gap-2">
                  <CarIcon className="w-8 h-8 transition-transform duration-300 group-hover:translate-x-1" />
                  Offer a Ride
                </span>
              </button>
            </>
          )}
        </div>

        {/* RIGHT COLUMN: Map */}
        <div className="lg:col-span-1 w-full h-full rounded-md pr-5">
          <MapComponent
            onRouteSelected={(route) => {
              setStart(route.start);
              setEnd(route.end);
            }}
          />
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
