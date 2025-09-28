"use client";
import React, { useState, useEffect } from "react";
import RecommendedRides from "./RecommendedRides";

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

      {tab === "myrides" && <MyRidesList />}
    </div>
  );

  function MyRidesList() {
    const [loading, setLoading] = useState(false);
    const [rides, setRides] = useState<Ride[] | null>(null);

    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/rides/mine");
        const data = await res.json();
        setRides(data.rides || []);
      } catch (err) {
        console.error(err);
        setRides([]);
      } finally {
        setLoading(false);
      }
    }

    return (
      <div>
        <button
          onClick={load}
          className="px-4 py-2 bg-[#6c62fe] text-white rounded-xl mb-4 font-medium transition-all duration-300 shadow hover:shadow-lg transform hover:scale-105"
        >
          Load My Rides
        </button>

        {loading && <div className="animate-pulse text-gray-400">Loading...</div>}
        {rides && rides.length === 0 && <div className="text-sm text-gray-600">No rides found.</div>}

        {rides && rides.length > 0 && (
          <ul className="space-y-4 mt-2">
            {rides.map((r) => (
              <li
                key={r._id}
                className="p-4 border rounded-2xl bg-white bg-opacity-80 hover:shadow-xl transition-all duration-300"
              >
                <div className="font-semibold text-lg">Ride {r._id}</div>
                <div className="text-sm text-gray-600">
                  {r.startTime} — {r.endTime}
                </div>
                <div className="mt-3">
                  <button className="px-3 py-1 bg-[#6c62fe] hover:bg-[#5a54e0] text-white rounded-xl text-sm font-medium transition-all duration-300 shadow hover:scale-105">
                    Request Ride
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }
}
