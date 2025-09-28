"use client";
import React, { useState, useEffect } from "react";

import RecommendedRides from "./RecommendedRides";

interface Ride {
  _id: string;
  driver: string;
  riders: Array<{
    user: { _id: string; firstName: string; lastName: string; email: string };
    request: { _id: string; startTime: string; finalTime: string; status: string };
    orderPickUp: number;
  }>;
  date: Date;
  startTime: string;
  finalTime: string;
  beginLocation: { lat: number; long: number };
  finalLocation: { lat: number; long: number };
  requestedRiders: string[];
  maxRiders: number;
  beginAddress?: string;
  finalAddress?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

async function getAddress(lat: number, lng: number) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return `${lat}, ${lng}`;

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
  );
  const data = await res.json();
  if (data.status === "OK") {
    return data.results[0].formatted_address;
  } else {
    console.error("Geocoding error:", data.status);
    return `${lat}, ${lng}`;
  }
}

export default function MyRides({ currentUserId }: { currentUserId: string }) {
  const [tab, setTab] = useState<"recommendations" | "myrides">("recommendations");

  return (
    <div className="bg-white bg-opacity-60 backdrop-blur-lg rounded-2xl p-6 shadow-lg shadow-purple-400/20 flex-grow transition-all duration-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#6c62fe]">Rides</h2>
        <div className="flex gap-2">
          {["recommendations", "myrides"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                tab === t
                  ? "bg-[#6c62fe] text-white shadow-md transform scale-105"
                  : "bg-white hover:bg-purple-100 text-gray-700"
              }`}
            >
              {t === "myrides" ? "My Rides" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}

        </div>

      </div>

      {tab === "recommendations" && (
        <div>
          <RecommendedRides
            currentUserId={currentUserId}
            request={{
              date: new Date().toISOString(),
              startTime: "08:30",
              beginLocation: { lat: 37.77, long: -122.42 },
              finalLocation: { lat: 37.79, long: -122.39 },
            }}
            mode={"schedules"}
          />
        </div>
      )}

      {tab === "myrides" && (
        <div>
          <p className="text-sm text-gray-600">Your active rides (fetched from /api/rides/mine):</p>
          <MyRidesList currentUserId={currentUserId} />
        </div>
      )}
    </div>
  );
}

function MyRidesList({ currentUserId }: { currentUserId: string }) {
  const [loading, setLoading] = useState(false);
  const [rides, setRides] = useState<Ride[] | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/rides/mine?id=${currentUserId}`);
      const data = await res.json();
      const rides: Ride[] = data.rides || [];

      // Fetch addresses for each ride
      const ridesWithAddresses = await Promise.all(
        rides.map(async (r) => {
          const beginAddress = await getAddress(r.beginLocation.lat, r.beginLocation.long);
          const finalAddress = await getAddress(r.finalLocation.lat, r.finalLocation.long);
          return { ...r, beginAddress, finalAddress };
        })
      );

      setRides(ridesWithAddresses);
    } catch (err) {
      console.error(err);
      setRides([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={load} className="px-3 py-1 bg-purple-600 text-white rounded mb-2">
        Load My Rides
      </button>
      {loading && <div>Loading...</div>}
      {rides && rides.length === 0 && <div className="text-sm text-gray-600">No rides found.</div>}
      {rides && rides.length > 0 && (
        <ul className="space-y-2 mt-2">
          {rides.map((r) => (
            <li key={r._id} className="p-2 border rounded">
              <div className="font-semibold">
                Ride at {r.beginAddress} → {r.finalAddress}
              </div>
              <div className="text-sm text-gray-600">
                {r.startTime} — {r.finalTime}
              </div>
              <div className="text-sm text-gray-600 mt-1">
                Riders: {r.riders.map((ri) => ri.user.firstName).join(", ")}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
