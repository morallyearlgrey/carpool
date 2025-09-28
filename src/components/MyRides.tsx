"use client";

import React, { useState } from 'react';
import RecommendedRides from './RecommendedRides';

interface Ride {
  _id: string;
  driver: string;
  riders: Array<{
    user: string;
    request: string;
    orderPickUp: number;
  }>;
  date: Date;
  startTime: string;
  endTime: string;
  beginLocation: { lat: number; long: number };
  finalLocation: { lat: number; long: number };
  requestedRiders: string[];
  maxRiders: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export default function MyRides({ currentUserId }:{ currentUserId: string }){
  const [tab, setTab] = useState<'recommendations'|'myrides'>('recommendations');

  return (
    <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 flex-grow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-purple-800">My Rides</h2>
        <div className="flex gap-2">
          <button onClick={()=>setTab('recommendations')} className={`px-3 py-1 rounded ${tab==='recommendations'?'bg-purple-600 text-white':''}`}>Recommendations</button>
          <button onClick={()=>setTab('myrides')} className={`px-3 py-1 rounded ${tab==='myrides'?'bg-purple-600 text-white':''}`}>My Rides</button>
        </div>
      </div>

      {tab === 'recommendations' && (
        <div>
          <RecommendedRides currentUserId={currentUserId} request={{ date: new Date().toISOString(), startTime: '08:30', beginLocation: { lat: 37.77, long: -122.42 }, finalLocation: { lat: 37.79, long: -122.39 } }} mode={'schedules'} />
        </div>
      )}

      {tab === 'myrides' && (
        <div>
          <p className="text-sm text-gray-600">Your active rides (fetched from /api/rides/mine):</p>
          <MyRidesList />
        </div>
      )}
    </div>
  );

  function MyRidesList(){
    const [loading, setLoading] = useState(false);
    const [rides, setRides] = useState<Ride[] | null>(null);

    async function load(){
      setLoading(true);
      try{
        const res = await fetch('/api/rides/mine');
        const data = await res.json();
        setRides(data.rides || []);
      }catch(err){
        console.error(err);
        setRides([]);
      }finally{setLoading(false)}
    }

    return (
      <div>
        <button onClick={load} className="px-3 py-1 bg-purple-600 text-white rounded mb-2">Load My Rides</button>
        {loading && <div>Loading...</div>}
        {rides && rides.length === 0 && <div className="text-sm text-gray-600">No rides found.</div>}
        {rides && rides.length > 0 && (
          <ul className="space-y-2 mt-2">
            {rides.map(r => (
              <li key={r._id} className="p-2 border rounded">
                <div className="font-semibold">Ride {r._id}</div>
                <div className="text-sm text-gray-600">{r.startTime} — {r.endTime}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    )
  }
}
