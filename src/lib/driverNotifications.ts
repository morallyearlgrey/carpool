// src/lib/driverNotification.ts
import { messaging } from "./firebaseClient";
import { getToken, onMessage } from "firebase/messaging";

export async function initDriverNotifications(userId: string) {
  try {
    const token = await getToken(messaging, { vapidKey: "YOUR_WEB_PUSH_VAPID_KEY" });
    if (token) {
      // Send token to backend to save in User.pushToken
      await fetch("/api/user/updatePushToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pushToken: token }),
      });
    }

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      alert(`New ride request from ${payload.data?.riderId}`);
    });
  } catch (err) {
    console.error("Failed to get push token:", err);
  }
}
