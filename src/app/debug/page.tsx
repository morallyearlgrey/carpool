'use client';

import { useEffect, useState } from 'react';

interface Request {
  _id: string;
  userId: string;
  beginLocation: { lat: number; long: number };
  finalLocation: { lat: number; long: number };
  date: string;
  startTime: string;
  finalTime: string;
  [key: string]: unknown;
}

interface Offer {
  _id: string;
  user: string;
  beginLocation: { lat: number; long: number };
  finalLocation: { lat: number; long: number };
  date: string;
  startTime: string;
  finalTime: string;
  [key: string]: unknown;
}

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  [key: string]: unknown;
}

interface Ride {
  _id: string;
  driver: string;
  riders: { user: string; request: string; orderPickUp: number }[];
  date: string;
  startTime: string;
  endTime: string;
  beginLocation: { lat: number; long: number };
  finalLocation: { lat: number; long: number };
  requestedRiders: string[];
  maxRiders: number;
  [key: string]: unknown;
}

const DebugPage = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/debug');
      const data = await res.json();
      setRequests(data.requests || []);
      setOffers(data.offers || []);
      setUsers(data.users || []);
      setRides(data.rides || []);
    } catch (err) {
      console.error('Failed to fetch debug data:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (type: 'request' | 'offer' | 'user' | 'ride', id: string) => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

    try {
      await fetch(`/api/${type}s/${id}`, { method: 'DELETE' });
      if (type === 'request') setRequests(reqs => reqs.filter(r => r._id !== id));
      else if (type === 'offer') setOffers(ofs => ofs.filter(o => o._id !== id));
      else if (type === 'user') setUsers(usrs => usrs.filter(u => u._id !== id));
      else if (type === 'ride') setRides(rds => rds.filter(r => r._id !== id));
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
        <ul className="space-y-2 max-h-64 overflow-y-auto">
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
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Offers</h2>
        {offers.length === 0 && <p>No offers found.</p>}
        <ul className="space-y-2 max-h-64 overflow-y-auto">
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

      {/* Users */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Users</h2>
        {users.length === 0 && <p>No users found.</p>}
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {users.map(u => (
            <li key={u._id} className="p-3 bg-gray-100 rounded flex justify-between items-start">
              <pre className="text-sm overflow-x-auto">{JSON.stringify(u, null, 2)}</pre>
              <button
                onClick={() => handleDelete('user', u._id)}
                className="ml-4 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Rides */}
      <section>
        <h2 className="text-2xl font-semibold mb-2">Rides</h2>
        {rides.length === 0 && <p>No rides found.</p>}
        <ul className="space-y-2 max-h-64 overflow-y-auto">
          {rides.map(r => (
            <li key={r._id} className="p-3 bg-gray-100 rounded flex justify-between items-start">
              <pre className="text-sm overflow-x-auto">{JSON.stringify(r, null, 2)}</pre>
              <button
                onClick={() => handleDelete('ride', r._id)}
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
