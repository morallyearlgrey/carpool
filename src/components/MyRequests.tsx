'use client';
import React, { useState, useEffect, useCallback } from "react";
import { Request } from "@/types/api";

type TabType = "incoming" | "outgoing" | "public";

export default function MyRequests({ currentUserId }: { currentUserId: string }) {
  const [tab, setTab] = useState<"incoming" | "outgoing" | "public">("incoming");

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-[#6c62fe]">Requests</h2>
        <div className="flex gap-2">
          {["incoming", "outgoing", "public"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t as TabType)}
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

      {/* Content */}
      <div className="flex-1 overflow-hidden p-3">
        {tab === "incoming" && <RequestsList type="incoming" userId={currentUserId} />}
        {tab === "outgoing" && <RequestsList type="outgoing" userId={currentUserId} />}
        {tab === "public" && <RequestsList type="public" userId={currentUserId} />}
      </div>
    </div>
  );
}

interface RequestsListProps {
  type: TabType;
  userId: string;
}

function RequestsList({ type, userId }: RequestsListProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Request[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (type === "public") res = await fetch(`/api/requests/public`);
      else res = await fetch(`/api/requests/${type}?id=${userId}`);
      const data = await res.json();
      setItems(data.requests || []);
    } catch (err) {
      console.error(err);
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

  // --- handle request actions ---
  const handleAction = async (r: Request, action: "accept" | "reject" | "cancel") => {
    let confirmMessage = "";
    if (action === "accept") {
      confirmMessage = type === "public" 
        ? "Accept this public request and create a ride?"
        : "Accept this request and create a ride?";
    } else if (action === "reject") {
      confirmMessage = "Reject this request?";
    } else if (action === "cancel") {
      confirmMessage = "Cancel this request?";
    }

    if (!confirm(confirmMessage)) return;

    try {
      let url = `/api/requests/${r._id}/respond`;
      let body: { action: string; userId?: string; driverId?: string } | null = { action };
      let method = "POST";

      // For public requests, we need to pass the driverId when accepting
      if (type === "public" && action === "accept") {
        body.driverId = userId;
      }

      if (action === "cancel") {
        url = `/api/requests/${r._id}`;
        method = "DELETE";
        body = null;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : null,
      });

      if (!res.ok) throw new Error("Action failed");
      setItems(prev => prev.filter(req => req._id !== r._id));
    } catch (err) {
      console.error(err);
      alert("Action failed.");
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="mb-2 text-sm text-gray-500">Automatically refreshes every 15s</div>
      {loading && <div className="animate-pulse text-gray-400">Loading...</div>}
      {!loading && items.length === 0 && <div className="text-sm text-gray-600">No {type} requests.</div>}
      <ul className="space-y-4 overflow-y-auto flex-1">
        {items.map((r) => (
          <li
            key={r._id}
            className="p-4 border rounded-2xl bg-white/80 hover:shadow-xl transition-all duration-300"
          >
            <div className="font-semibold text-lg">
              {type === "incoming"
                ? (typeof r.requestSender === 'object' && r.requestSender?.firstName) || "Rider"
                : type === "outgoing"
                ? `To: ${(typeof r.requestReceiver === 'object' && r.requestReceiver?.firstName) || "Driver"}`
                : (typeof r.requestSender === 'object' && r.requestSender?.firstName) || "Rider"}
            </div>

            <div className="text-sm text-gray-600">{r.startTime} — {r.finalTime}</div>

            <div className="mt-2 flex gap-2">
              {type === "incoming" && (
                <>
                  <ActionButton color="green" onClick={() => handleAction(r, "accept")}>Accept</ActionButton>
                  <ActionButton color="red" onClick={() => handleAction(r, "reject")}>Reject</ActionButton>
                </>
              )}
              {type === "outgoing" && (
                <ActionButton color="red" onClick={() => handleAction(r, "cancel")}>Cancel</ActionButton>
              )}
              {type === "public" && (
                <ActionButton color="purple" onClick={() => handleAction(r, "accept")}>Accept</ActionButton>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActionButton({ color, onClick, children }: { color: "green" | "red" | "purple"; onClick: () => void; children: React.ReactNode }) {
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