"use client";

import { getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";
import { getFirebaseApp } from "./client";

let messagingInstance: Messaging | null = null;
let messagingPromise: Promise<Messaging | null> | null = null;

async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;

  const supported = await isSupported();
  if (!supported) return null;

  const app = getFirebaseApp();
  if (!app) return null;

  if (messagingInstance) return messagingInstance;

  if (!messagingPromise) {
    messagingPromise = import("firebase/messaging").then(({ getMessaging }) => {
      messagingInstance = getMessaging(app);
      return messagingInstance;
    });
  }

  return messagingPromise;
}

export async function registerMessagingServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    return await navigator.serviceWorker.register("/firebase-messaging-sw.js", {
      scope: "/",
    });
  } catch (error) {
    console.warn("[FCM_SW_REGISTER_ERROR]", error);
    return null;
  }
}

export async function requestFcmToken(): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    console.warn("[FCM_VAPID_KEY_MISSING]");
    return null;
  }

  const registration = await registerMessagingServiceWorker();
  if (!registration) return null;

  try {
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (error) {
    console.warn("[FCM_TOKEN_ERROR]", error);
    return null;
  }
}

export async function subscribeToForegroundMessages(
  handler: (payload: import("firebase/messaging").MessagePayload) => void,
): Promise<(() => void) | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  return onMessage(messaging, handler);
}

export { isSupported as isMessagingSupported };
