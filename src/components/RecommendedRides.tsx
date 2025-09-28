"use client";

import React, { useEffect, useState } from 'react';

type Location = { lat: number; long: number };

export default function RecommendedRides({ currentUserId, request, mode = 'rides' }: { currentUserId: string; request: { date: string; startTime: string; beginLocation: Location; finalLocation: Location }, mode?: 'rides' | 'schedules' }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId || !request) return;
    setLoading(true);
    fetch('/api/recommendations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ userId: currentUserId, ...request, mode }),
    })
      .then(async (r) => {
        const data = await r.json().catch(() => null);
        if (!r.ok) {
          // show message from API if available (uiMessage preferred for end-user text)
          setMessage(data?.uiMessage || data?.error || 'Failed to fetch recommendations');
          setCandidates([]);
          return;
        }
        setMessage(null);
        setCandidates(data?.candidates || []);
      })
      .catch((e) => {
        console.error(e);
        setMessage('Failed to fetch recommendations');
      })
      .finally(() => setLoading(false));
  }, [currentUserId, request, mode]);

  const sendRequest = async (rideId?: string, driverId?: string) => {
    setSending(rideId || driverId || null);
    try {
      const res = await fetch('/api/recommendations/requestDriver', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          riderId: currentUserId,
          rideId,
          driverId,
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
  if (message) return <div className="p-4 text-gray-600">{message}</div>;
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
            <tr key={c.id || c.rideId || c.driver?._id} className="border-t">
                <td className="p-2">{c.driver?.firstName || c.driver?.email || 'Driver'}</td>
                <td className="p-2">{c.ride ? `${c.ride.beginLocation?.lat?.toFixed?.(2) || ''},${c.ride.beginLocation?.long?.toFixed?.(2) || ''} → ${c.ride.finalLocation?.lat?.toFixed?.(2) || ''},${c.ride.finalLocation?.long?.toFixed?.(2) || ''}` : (c.beginLocation ? `${c.beginLocation.lat?.toFixed?.(2)},${c.beginLocation.long?.toFixed?.(2)} → ${c.finalLocation?.lat?.toFixed?.(2)},${c.finalLocation?.long?.toFixed?.(2)}` : 'Nearby schedule')}</td>
                <td className="p-2">{c.startTime || c.ride?.startTime || '-'}</td>
              <td className="p-2">{c.seatsLeft ?? '-'}</td>
              <td className="p-2">{(c.score ?? 0).toFixed?.(2)}</td>
              <td className="p-2">
                <button disabled={!!sending} className="bg-[#6c62fe] text-white px-3 py-1 rounded" onClick={() => sendRequest(c.rideId, c.driver?._id)}>
                  {sending === (c.rideId || c.driver?._id) ? 'Sending...' : 'Request'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
