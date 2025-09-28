"use client";

import React, { useState } from 'react';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Request {
  _id: string;
  user: User | string;
  driver?: User;
  beginLocation: { lat: number; long: number };
  finalLocation: { lat: number; long: number };
  date: Date;
  startTime: string;
  finalTime: string;
  createdAt?: Date;
  updatedAt?: Date;
}

function MyRequests() {
  const [tab, setTab] = useState<'incoming'|'outgoing'>('incoming');

  return (
    <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 flex-grow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-purple-800">My Requests</h2>
        <div className="flex gap-2">
          <button onClick={()=>setTab('incoming')} className={`px-3 py-1 rounded ${tab==='incoming'?'bg-purple-600 text-white':''}`}>Incoming</button>
          <button onClick={()=>setTab('outgoing')} className={`px-3 py-1 rounded ${tab==='outgoing'?'bg-purple-600 text-white':''}`}>Outgoing</button>
        </div>
      </div>

      {tab === 'incoming' && <IncomingRequests />}
      {tab === 'outgoing' && <OutgoingRequests />}
    </div>
  );
}

function IncomingRequests(){
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Request[] | null>(null);

  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/requests/incoming');
      const data = await res.json();
      setItems(data.requests || []);
    }catch(err){
      console.error(err);
      setItems([]);
    }finally{setLoading(false)}
  }

  React.useEffect(() => {
    // initial load
    load();
    // poll every 15s
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      <div className="mb-2 text-sm text-gray-500">Automatically refreshes every 15s</div>
      {loading && <div>Loading...</div>}
      {items && items.length === 0 && <div className="text-sm text-gray-600">No incoming requests.</div>}
      {items && items.length > 0 && (
        <ul className="space-y-2 mt-2">
          {items.map(r => (
            <li key={r._id} className="p-2 border rounded">
              <div className="font-semibold">{typeof r.user === 'object' ? r.user.firstName : 'Rider'}</div>
              <div className="text-sm text-gray-600">{r.startTime} — {r.finalTime}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OutgoingRequests(){
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Request[] | null>(null);
  async function load(){
    setLoading(true);
    try{
      const res = await fetch('/api/requests/outgoing');
      const data = await res.json();
      setItems(data.requests || []);
    }catch(err){
      console.error(err);
      setItems([]);
    }finally{setLoading(false)}
  }

  React.useEffect(() => {
    // initial load
    load();
    // poll every 15s
    const iv = setInterval(load, 15000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div>
      <div className="mb-2 text-sm text-gray-500">Automatically refreshes every 15s</div>
      {loading && <div>Loading...</div>}
      {items && items.length === 0 && <div className="text-sm text-gray-600">No outgoing requests.</div>}
      {items && items.length > 0 && (
        <ul className="space-y-2 mt-2">
          {items.map(r => (
            <li key={r._id} className="p-2 border rounded">
              <div className="font-semibold">To: {r.driver?.firstName || 'Driver'}</div>
              <div className="text-sm text-gray-600">{r.startTime} — {r.finalTime}</div>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={async () => {
                    if (!confirm('Cancel this outgoing request?')) return;
                    try {
                      const res = await fetch(`/api/requests/${r._id}`, { method: 'DELETE' });
                      if (!res.ok) throw new Error('Failed to cancel request');
                      // refresh list
                      await load();
                    } catch (err) {
                      console.error(err);
                      alert('Failed to cancel request.');
                    }
                  }}
                  className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default MyRequests;
