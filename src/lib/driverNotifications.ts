// src/lib/driverNotifications.ts
import { messaging } from "./firebaseClient"; // your Firebase setup
import { getToken, onMessage } from "firebase/messaging";

export async function initDriverNotifications(userId: string) {
  try {
    // Request FCM token
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
      if (Notification.permission === "granted") {
        const notif = new Notification(payload.notification?.title || "New Ride Request", {
          body: payload.notification?.body,
          data: payload.data,
        });

        notif.onclick = () => {
          // Optional: navigate to ride request page
          window.open(`/dashboard/driver/requests/${payload.data?.requestId}`, "_blank");
        };
      }
    });

    // Ask for notification permission if not already granted
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
  } catch (err) {
    console.error("Failed to register driver notifications:", err);
  }
}
