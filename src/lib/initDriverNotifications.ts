// src/lib/driverNotifications.ts
import { messaging } from "./firebaseClient";
import { getToken, onMessage } from "firebase/messaging";

export async function initDriverNotifications(userId: string) {
  try {
    // 1️⃣ Get FCM token
    const token = await getToken(messaging, { vapidKey: "YOUR_WEB_PUSH_VAPID_KEY" });
    if (token) {
      // 2️⃣ Send token to backend to save in User.pushToken
      await fetch("/api/user/updatePushToken", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, pushToken: token }),
      });
    }

    // 3️⃣ Handle messages when app is in foreground
    onMessage(messaging, (payload) => {
      console.log("Received foreground message:", payload);

      // Show a browser notification
      if (Notification.permission === "granted") {
        new Notification(payload.notification?.title || "New Ride Request", {
          body: payload.notification?.body,
          data: payload.data,
        });
      }
    });

    // 4️⃣ Ask for notification permission
    if (Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
  } catch (err) {
    console.error("Failed to get push token:", err);
  }
}
