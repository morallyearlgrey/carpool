// src/lib/driverNotifications.ts
import { getToken, onMessage, Messaging } from "firebase/messaging";

// Function to initialize driver notifications
export async function initDriverNotifications(userId: string, messaging: Messaging | null) {
  if (!messaging) {
    console.warn("Firebase messaging is not available in this environment.");
    return;
  }

  try {
    // Request notification permission first
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }

    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted.");
      return;
    }

    // Get FCM token
    const token = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
    });

    if (token) {
      // Send token to backend
      await fetch("/api/user/updatePushToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pushToken: token }),
      });
    }

    // Listen for foreground messages
    onMessage(messaging, (payload) => {
      const notif = new Notification(payload.notification?.title || "New Ride Request", {
        body: payload.notification?.body,
        data: payload.data,
      });

      notif.onclick = () => {
        if (payload.data?.requestId) {
          window.open(`/dashboard/driver/requests/${payload.data.requestId}`, "_blank");
        }
      };
    });
  } catch (err) {
    console.error("Failed to register driver notifications:", err);
  }
}
