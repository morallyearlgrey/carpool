"use client";

import React, { useEffect, useState } from 'react';

type Location = { lat: number; long: number };

export default function RecommendedRides({ currentUserId, request }: { currentUserId: string; request: { date: string; startTime: string; beginLocation: Location; finalLocation: Location } }) {
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId || !request) return;
    setLoading(true);
    fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, ...request }),
    })
      .then(r => r.json())
      .then(data => setCandidates(data.candidates || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentUserId, request]);

  const sendRequest = async (rideId: string) => {
    setSending(rideId);
    try {
      const res = await fetch('/api/recommendations/requestDriver', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          riderId: currentUserId,
          rideId,
          beginLocation: request.beginLocation,
          finalLocation: request.finalLocation,
          date: request.date,
          startTime: request.startTime,
          finalTime: request.startTime
        }),
      });
      const data = await res.json();
      if (data.ok) {
        alert('Request sent to driver — waiting for confirmation.');
        // TODO: implement polling or websocket to await confirmation
      } else {
        alert('Failed to send request');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to send request');
    } finally {
      setSending(null);
    }
  };

  if (loading) return <div className="p-4">Searching for recommended rides...</div>;
  if (!candidates.length) return <div className="p-4 text-gray-600">No suggested rides available.</div>;

  return (
    <div className="w-full overflow-auto">
      <table className="min-w-full table-auto">
        <thead>
          <tr>
            <th className="text-left p-2">Driver</th>
            <th className="text-left p-2">Route</th>
            <th className="text-left p-2">Start</th>
            <th className="text-left p-2">Seats</th>
            <th className="text-left p-2">Score</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((c) => (
            <tr key={c.rideId || c.driver?._id} className="border-t">
              <td className="p-2">{c.driver?.firstName || c.driver?.email || 'Driver'}</td>
              <td className="p-2">{c.ride ? `${c.ride.beginLocation?.lat?.toFixed?.(2) || ''},${c.ride.beginLocation?.long?.toFixed?.(2) || ''} → ${c.ride.finalLocation?.lat?.toFixed?.(2) || ''},${c.ride.finalLocation?.long?.toFixed?.(2) || ''}` : (c.schedule ? 'Nearby schedule' : '')}</td>
              <td className="p-2">{c.ride?.startTime || (c.schedule?.availableTimes?.[0]?.startTime) || '-'}</td>
              <td className="p-2">{c.seatsLeft ?? '-'}</td>
              <td className="p-2">{(c.score ?? 0).toFixed?.(2)}</td>
              <td className="p-2">
                <button disabled={!!sending} className="bg-purple-600 text-white px-3 py-1 rounded" onClick={() => sendRequest(c.rideId)}>
                  {sending === c.rideId ? 'Sending...' : 'Request'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
