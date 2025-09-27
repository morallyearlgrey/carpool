'use client';

import React, { useEffect, useState } from 'react';

interface Request {
  _id: string;
  user: string;
  beginLocation: { lat: number; long: number };
  finalLocation: { lat: number; long: number };
  date: string;
  startTime: string;
  finalTime: string;
  [key: string]: any;
}

interface Offer {
  _id: string;
  user: string;
  beginLocation: { lat: number; long: number };
  finalLocation: { lat: number; long: number };
  date: string;
  startTime: string;
  finalTime: string;
  [key: string]: any;
}

const DebugPage = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/debug');
      const data = await res.json();
      setRequests(data.requests || []);
      setOffers(data.offers || []);
    } catch (err) {
      console.error('Failed to fetch debug data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (type: 'request' | 'offer', id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      await fetch(`/api/${type}s/${id}`, { method: 'DELETE' });
      if (type === 'request') setRequests(reqs => reqs.filter(r => r._id !== id));
      else setOffers(ofs => ofs.filter(o => o._id !== id));
    } catch (err) {
      console.error('Failed to delete', type, id, err);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Debug Page</h1>
      {loading && <p>Loading...</p>}

      {/* Requests */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Requests</h2>
        {requests.length === 0 && <p>No requests found.</p>}
        <ul className="space-y-2">
          {requests.map(r => (
            <li key={r._id} className="p-3 bg-gray-100 rounded flex justify-between items-start">
              <pre className="text-sm overflow-x-auto">{JSON.stringify(r, null, 2)}</pre>
              <button
                onClick={() => handleDelete('request', r._id)}
                className="ml-4 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Offers */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Offers</h2>
        {offers.length === 0 && <p>No offers found.</p>}
        <ul className="space-y-2">
          {offers.map(o => (
            <li key={o._id} className="p-3 bg-gray-100 rounded flex justify-between items-start">
              <pre className="text-sm overflow-x-auto">{JSON.stringify(o, null, 2)}</pre>
              <button
                onClick={() => handleDelete('offer', o._id)}
                className="ml-4 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default DebugPage;
