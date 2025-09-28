"use client";
import React, { useState, useEffect } from "react";

interface MyRequestsProps {
  currentUserId: string;
}

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

function MyRequests({ currentUserId }: MyRequestsProps) {
  const [tab, setTab] = useState<"incoming" | "outgoing" | "public">("incoming");

  return (
    <div className="bg-white bg-opacity-60 backdrop-blur-lg rounded-2xl p-6 shadow-lg shadow-purple-400/20 flex-grow transition-all duration-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-[#6c62fe]">Requests</h2>
        <div className="flex gap-2">
          {["incoming", "outgoing", "public"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as any)}
              className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                tab === t
                  ? "bg-[#6c62fe] text-white shadow-md transform scale-105"
                  : "bg-white hover:bg-purple-100 text-gray-700"
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {tab === "incoming" && <RequestsList type="incoming" userId={currentUserId} />}
      {tab === "outgoing" && <RequestsList type="outgoing" userId={currentUserId} />}
      {tab === "public" && <RequestsList type="public" userId={currentUserId} />}
    </div>
  );
}

interface RequestsListProps {
  type: "incoming" | "outgoing" | "public";
  userId: string;
}

function RequestsList({ type, userId }: RequestsListProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Request[] | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (type === "public") {
        res = await fetch(`/api/requests/public`);
      } else {
        if (!userId) return;
        res = await fetch(`/api/requests/${type}?id=${userId}`);
      }
      const data = await res.json();
      setItems(data.requests || []);
    } catch (err) {
      console.error(`${type} requests GET error:`, err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [type, userId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  // --- helper functions to optimistically remove a request ---
  const handleAccept = async (r: Request) => {
    if (!confirm('Accept this request and create a ride?')) return;
    try {
      const res = await fetch(`/api/requests/${r._id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept' }),
      });
      if (!res.ok) throw new Error('Failed to accept request');

      await fetch(`/api/requests/${r._id}`, { method: 'DELETE' });

      // remove from list immediately
      setItems(prev => prev?.filter(req => req._id !== r._id) || []);
    } catch (err) {
      console.error(err);
      alert('Failed to accept request.');
    }
  };

  const handleReject = async (r: Request) => {
    if (!confirm('Reject this request?')) return;
    try {
      const res = await fetch(`/api/requests/${r._id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject' }),
      });
      if (!res.ok) throw new Error('Failed to reject request');

      // remove from list immediately
      setItems(prev => prev?.filter(req => req._id !== r._id) || []);
    } catch (err) {
      console.error(err);
      alert('Failed to reject request.');
    }
  };

  return (
    <div>
      <div className="mb-2 text-sm text-gray-500">Automatically refreshes every 15s</div>
      {loading && <div className="animate-pulse text-gray-400">Loading...</div>}
      {!loading && items && items.length === 0 && (
        <div className="text-sm text-gray-600">No {type} requests.</div>
      )}
      {items && items.length > 0 && (
        <ul className="space-y-4 mt-2">
          {items.map((r: any) => (
            <li
              key={r._id}
              className="p-4 border rounded-2xl bg-white bg-opacity-80 hover:shadow-xl transition-all duration-300"
            >
              <div className="font-semibold text-lg">
                {type === "incoming"

                  ? r.requestSender?.firstName || "Rider"
                  : type === "outgoing"
                  ? `To: ${r.requestReceiver?.firstName || "Driver"}`
                  : r.requestSender?.firstName || "Rider"}
              </div>
              <div className="text-sm text-gray-600">{r.startTime} — {r.finalTime}</div>

              {type === "incoming" && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleAccept(r)}
                    className="px-2 py-1 bg-green-600 text-white rounded text-sm"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleReject(r)}
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
                        setItems(prev => prev?.filter(req => req._id !== r._id) || []);
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

              {type === "public" && (
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={async () => {
                      if (!confirm("Claim this public request?")) return;
                      try {
                        const res = await fetch(`/api/requests/${r._id}/respond`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: 'accept', driverId: userId }),
                        });
                        if (!res.ok) throw new Error("Failed to claim request");
                        setItems(prev => prev?.filter(req => req._id !== r._id) || []);
                      } catch (err) {
                        console.error(err);
                        alert("Failed to claim request.");
                      }
                    }}
                    className="px-2 py-1 bg-blue-600 text-white rounded text-sm"
                  >
                    Claim
                  </ActionButton>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ActionButton({
  color,
  onClick,
  children,
}: {
  color: "green" | "red" | "purple";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    green: "bg-green-600 hover:bg-green-700",
    red: "bg-red-500 hover:bg-red-600",
    purple: "bg-[#6c62fe] hover:bg-[#5a54e0]",
  };
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-xl text-white text-sm font-medium transition-all duration-300 shadow-sm ${colors[color]} transform hover:scale-105`}
    >
      {children}
    </button>
  );
}

async function handleAction(
  id: string,
  action: "accept" | "reject" | "cancel" | "claim",
  reload: () => void,
  userId?: string
) {
  let confirmMsg = "";
  switch (action) {
    case "accept":
      confirmMsg = "Accept this request and create a ride?";
      break;
    case "reject":
      confirmMsg = "Reject this request?";
      break;
    case "cancel":
      confirmMsg = "Cancel this outgoing request?";
      break;
    case "claim":
      confirmMsg = "Claim this public request?";
      break;
  }
  if (!confirm(confirmMsg)) return;

  try {
    let url = `/api/requests/${id}/respond`;
    let body: any = { action };
    let method = "POST";

    if (action === "cancel") {
      url = `/api/requests/${id}`;
      method = "DELETE";
      body = null;
    } else if (action === "claim") {
      url = `/api/requests/${id}/claim`;
      body = { driverId: userId };
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : null,
    });

    if (!res.ok) throw new Error("Action failed");
    await reload();
  } catch (err) {
    console.error(err);
    alert("Action failed.");
  }
}

export default MyRequests;
