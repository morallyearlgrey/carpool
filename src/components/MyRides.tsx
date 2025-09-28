'use client';
import React, { useState, useEffect } from "react";
import RecommendedRides from "./RecommendedRides";

interface Ride {
  _id: string;
  driver: string;
  riders: Array<{
    user: { _id: string; firstName: string; lastName: string; email } | string;
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
}

async function getAddress(lat: number, lng: number) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return `${lat}, ${lng}`;
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
  );
  const data = await res.json();
  if (data.status === "OK") return data.results[0].formatted_address;
  return `${lat}, ${lng}`;
}

export default function MyRides({ currentUserId }: { currentUserId: string }) {
  const [tab, setTab] = useState<"recommendations" | "myrides">("recommendations");

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-[#6c62fe]">Rides</h2>
        <div className="flex gap-2">
          {["recommendations", "myrides"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                tab === t
                  ? "bg-[#6c62fe] text-white shadow-lg transform scale-105"
                  : "bg-white hover:bg-purple-100 text-gray-700"
              }`}
            >
              {t === "myrides" ? "My Rides" : "Recommendations"}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {tab === "recommendations" && (
          <div className="h-full overflow-auto p-3">
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
          <div className="flex flex-col h-full p-3 overflow-hidden">
            <p className="text-sm text-gray-600 mb-2">Your active rides:</p>
            <MyRidesList currentUserId={currentUserId} />
          </div>
        )}
      </div>
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

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <button
        onClick={load}
        className="px-3 py-1 mb-2 bg-[#6c62fe] text-white rounded-md hover:bg-[#5a54e0] transition-all"
      >
        Refresh My Rides
      </button>

      {loading && <div className="text-center text-gray-500">Loading...</div>}
      {!loading && rides?.length === 0 && <div className="text-sm text-gray-600">No rides found.</div>}

      <ul className="flex-1 overflow-y-auto space-y-2">
        {rides?.map((r) => (
          <li
            key={r._id}
            className="p-3 border rounded-2xl hover:shadow-lg transition cursor-pointer bg-white/80"
          >
            <div className="font-semibold text-[#6c62fe]">
              {r.beginAddress} → {r.finalAddress}
            </div>
            <div className="text-sm text-gray-600">
              {r.startTime} — {r.finalTime}
            </div>
            <div className="text-sm text-gray-600 mt-1">
  Riders: {r.riders
    .map((ri) => {
      if (ri.user && typeof ri.user === "object" && "firstName" in ri.user) {
        return ri.user.firstName;
      }
      return "Unknown";
    })
    .join(", ")}
</div>




          </li>
        ))}
      </ul>
    </div>
  );
}
