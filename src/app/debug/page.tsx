"use client";

import React, { useEffect, useState } from "react";

interface RideRequest {
  _id: string;
  user: string;
  beginLocation: { lat: number; long: number };
  finalLocation: { lat: number; long: number };
  date: string;
  startTime: string;
  finalTime: string;
  createdAt?: string;
}

interface RideOffer {
  _id: string;
  user: string;
  beginLocation: { lat: number; long: number };
  finalLocation: { lat: number; long: number };
  date: string;
  startTime: string;
  finalTime: string;
  seats?: number;
  createdAt?: string;
}

export default function DebugPage() {
  const [requests, setRequests] = useState<RideRequest[]>([]);
  const [offers, setOffers] = useState<RideOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/debug");
        const data = await res.json();
        setRequests(data.requests || []);
        setOffers(data.offers || []);
      } catch (err) {
        console.error("Failed to fetch debug data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Debug Page</h1>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Debug Page</h1>

      {/* Requests */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold mb-2">All Ride Requests</h2>
        {requests.length === 0 ? (
          <p className="text-gray-600">No requests found.</p>
        ) : (
          <table className="table-auto w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">User</th>
                <th className="border px-2 py-1">Begin</th>
                <th className="border px-2 py-1">End</th>
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Start</th>
                <th className="border px-2 py-1">Final</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r._id}>
                  <td className="border px-2 py-1">{r.user}</td>
                  <td className="border px-2 py-1">
                    {r.beginLocation.lat}, {r.beginLocation.long}
                  </td>
                  <td className="border px-2 py-1">
                    {r.finalLocation.lat}, {r.finalLocation.long}
                  </td>
                  <td className="border px-2 py-1">{r.date}</td>
                  <td className="border px-2 py-1">{r.startTime}</td>
                  <td className="border px-2 py-1">{r.finalTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Offers */}
      <div>
        <h2 className="text-xl font-semibold mb-2">All Ride Offers</h2>
        {offers.length === 0 ? (
          <p className="text-gray-600">No offers found.</p>
        ) : (
          <table className="table-auto w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">User</th>
                <th className="border px-2 py-1">Begin</th>
                <th className="border px-2 py-1">End</th>
                <th className="border px-2 py-1">Date</th>
                <th className="border px-2 py-1">Start</th>
                <th className="border px-2 py-1">Final</th>
                <th className="border px-2 py-1">Seats</th>
              </tr>
            </thead>
            <tbody>
              {offers.map((o) => (
                <tr key={o._id}>
                  <td className="border px-2 py-1">{o.user}</td>
                  <td className="border px-2 py-1">
                    {o.beginLocation.lat}, {o.beginLocation.long}
                  </td>
                  <td className="border px-2 py-1">
                    {o.finalLocation.lat}, {o.finalLocation.long}
                  </td>
                  <td className="border px-2 py-1">{o.date}</td>
                  <td className="border px-2 py-1">{o.startTime}</td>
                  <td className="border px-2 py-1">{o.finalTime}</td>
                  <td className="border px-2 py-1">{o.seats ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}