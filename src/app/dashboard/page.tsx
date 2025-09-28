'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import MyRides from '@/components/MyRides';
import MyRequests from '@/components/MyRequests';
import { Navbar } from '@/components/navbar';

const MapComponent = dynamic(() => import('@/components/MapComponent'), { ssr: false });

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated';

  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [showComponent, setShowComponent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [offerLoading, setOfferLoading] = useState(false);

  const [requestResults, setRequestResults] = useState<any[] | null>(null);

  const [start, setStart] = useState<{ latLng: google.maps.LatLng; address: string } | null>(null);
  const [end, setEnd] = useState<{ latLng: google.maps.LatLng; address: string } | null>(null);

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

const [startTime, setStartTime] = useState(getCurrentTime());

  const [endTime, setEndTime] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    setIsMounted(true);
    setShowComponent(true);
  }, []);

  const animationClasses = (delay: string) =>
    `transition-all duration-700 ease-out ${isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`;

  // --- Handlers ---
  const handleRequestSubmit = async () => {
  if (!start || !end) return alert('Please select both start and end locations.');
  setRequestLoading(true);
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
    let rideId: string | null = null;

    if (candidates.length > 0) {
      setRequestResults(candidates);
      rideId = candidates[0]?._id || null;
    } else {
      const publicRes = await fetch('/api/requests/public', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: (session as any)?.user?.id || (session as any)?.user?.email || '',
          beginLocation: { lat: start.latLng.lat(), long: start.latLng.lng() },
          finalLocation: { lat: end.latLng.lat(), long: end.latLng.lng() },
          date,
          startTime,
          finalTime: endTime,
        }),
      });
      const publicData = await publicRes.json();
      rideId = publicData.requestId;
      setRequestResults([]);
    }
    setCurrentRideId(rideId);
    alert("Your request has been posted")
  } catch (err) {
    console.error(err);
    alert('Error sending request. Please try again.');
  } finally {
    setRequestLoading(false);
  }
};

const handleOfferSubmit = async () => {
  if (!start || !end) return alert('Please select both start and end locations.');
  setOfferLoading(true);
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
        finalTime: endTime,
      }),
    });
    const data = await res.json();
    setCurrentRideId(data.offer?._id || null);
    setRequestResults([]);
    alert("Your offer has been posted!")
  } catch (err) {
    console.error(err);
    alert('Error sending offer. Please try again.');
  } finally {
    setOfferLoading(false);
  }
};


  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Navbar isLoggedIn={isLoggedIn} />

      {/* Full-height content grid */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 px-8 pb-8 h-full">
{/* LEFT COLUMN */}
{/* LEFT COLUMN */}
<div className={`lg:col-span-1 flex flex-col gap-4 p-6 overflow-hidden ${animationClasses('100ms')}`}>
  {/* MyRides card */}
  <div className="flex flex-col flex-[1_1_0] overflow-hidden">
    <MyRides currentUserId={(session as any)?.user?.id || (session as any)?.user?.email || ''} />
  </div>

  {/* MyRequests card */}
  {session?.user?.id && (
    <div className="flex flex-col flex-[1_1_0] overflow-hidden">
      <MyRequests currentUserId={session.user.id} />
    </div>
  )}
</div>

{/* MIDDLE + RIGHT COLUMN (controls + map) */}
<div className={`lg:col-span-2 flex flex-col h-full min-h-0 ${animationClasses('200ms')}`}>
  {/* Compact Controls Row */}
  <div className="flex flex-wrap items-center gap-2 bg-white/70 rounded-lg p-2 shadow-sm">
    <input
      type="date"
      value={date}
      onChange={(e) => setDate(e.target.value)}
      className="h-9 px-3 text-sm border rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
    />
    <input
      type="time"
      value={startTime}
      onChange={(e) => setStartTime(e.target.value)}
      className="h-9 px-3 text-sm border rounded-md focus:outline-none focus:ring focus:ring-indigo-300"
    />
    <input
      type="time"
      value={endTime}
      readOnly
      className="h-9 px-3 text-sm border rounded-md bg-gray-100 text-gray-500 cursor-not-allowed"
    />
    <button
  onClick={handleRequestSubmit}
  className="h-9 px-3 text-sm bg-[#6c62fe] text-white rounded-md hover:bg-[#5951e6] disabled:opacity-50"
  disabled={requestLoading}
>
  {requestLoading ? 'Requesting...' : 'Request'}
</button>

<button
  onClick={handleOfferSubmit}
  className="h-9 px-3 text-sm bg-[#342b52] text-white rounded-md hover:bg-green-500 disabled:opacity-50"
  disabled={offerLoading}
>
  {offerLoading ? 'Offering...' : 'Offer'}
</button>

  </div>

  {/* Map fills remaining height */}
  <div className="flex-grow mt-3 min-h-0 rounded-md overflow-hidden shadow-lg">
    {showComponent && (
      <MapComponent
          onRouteSelected={(route, durationSeconds) => {
            setStart(route.start);
            setEnd(route.end);

            if (durationSeconds && startTime) {
              // Compute end time by adding duration
              const [hours, minutes] = startTime.split(':').map(Number);
              const startDate = new Date();
              startDate.setHours(hours, minutes);

              const endDate = new Date(startDate.getTime() + durationSeconds * 1000);
              const endHours = endDate.getHours().toString().padStart(2, '0');
              const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

              setEndTime(`${endHours}:${endMinutes}`);
            }
          }}
        />

    )}
  </div>
</div>




      </main>
    </div>
  );
};

export default DashboardPage;
