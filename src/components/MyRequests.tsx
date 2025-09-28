"use client";
import React, { useState, useEffect } from "react";

interface MyRequestsProps {
  currentUserId: string; // use string, not ObjectId
}

export default function MyRequests({ currentUserId }: MyRequestsProps) {
  const [tab, setTab] = useState<"incoming" | "outgoing">("incoming");

  return (
    <div className="bg-white bg-opacity-50 backdrop-blur-lg rounded-xl p-6 shadow-lg shadow-purple-500/10 flex-grow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-purple-800">My Requests</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setTab("incoming")}
            className={`px-3 py-1 rounded ${tab === "incoming" ? "bg-purple-600 text-white" : ""}`}
          >
            Incoming
          </button>
          <button
            onClick={() => setTab("outgoing")}
            className={`px-3 py-1 rounded ${tab === "outgoing" ? "bg-purple-600 text-white" : ""}`}
          >
            Outgoing
          </button>
        </div>
      </div>

      {tab === "incoming" && <RequestsList type="incoming" userId={currentUserId} />}
      {tab === "outgoing" && <RequestsList type="outgoing" userId={currentUserId} />}
    </div>
  );
}

interface RequestsListProps {
  type: "incoming" | "outgoing";
  userId: string;
}

function RequestsList({ type, userId }: RequestsListProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/requests/${type}?id=${userId}`);
      const data = await res.json();
      setItems(data.requests || []);
    } catch (err) {
      console.error(`${type} requests GET error:`, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load(); // initial load
    const interval = setInterval(load, 15000); // poll every 15s
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <div>
      <div className="mb-2 text-sm text-gray-500">Automatically refreshes every 15s</div>
      {loading && <div>Loading...</div>}
      {!loading && items.length === 0 && <div className="text-sm text-gray-600">No {type} requests.</div>}
      {items.length > 0 && (
        <ul className="space-y-2 mt-2">
          {items.map((r: any) => (
            <li key={r._id} className="p-2 border rounded">
              <div className="font-semibold">
                {type === "incoming" ? r.requestSender?.firstName || "Rider" : `To: ${r.driver?.firstName || "Driver"}`}
              </div>
              <div className="text-sm text-gray-600">{r.startTime} — {r.finalTime}</div>
              {type === "incoming" && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={async () => {
                      if (!confirm('Accept this request and create a ride?')) return;
                      try {
                        const res = await fetch(`/api/requests/${r._id}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept' }) });
                        if (!res.ok) throw new Error('Failed to accept');
                        await load();
                      } catch (err) {
                        console.error(err);
                        alert('Failed to accept request.');
                      }
                    }}
                    className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm('Reject this request?')) return;
                      try {
                        const res = await fetch(`/api/requests/${r._id}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject' }) });
                        if (!res.ok) throw new Error('Failed to reject');
                        await load();
                      } catch (err) {
                        console.error(err);
                        alert('Failed to reject request.');
                      }
                    }}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    Reject
                  </button>
                </div>
              )}
              {type === "outgoing" && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={async () => {
                      if (!confirm("Cancel this outgoing request?")) return;
                      try {
                        const res = await fetch(`/api/requests/${r._id}`, { method: "DELETE" });
                        if (!res.ok) throw new Error("Failed to cancel request");
                        await load();
                      } catch (err) {
                        console.error(err);
                        alert("Failed to cancel request.");
                      }
                    }}
                    className="px-2 py-1 bg-red-500 text-white rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
