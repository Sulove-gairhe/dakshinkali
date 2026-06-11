"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@dakshinkali/auth";
import {
  isMessagingSupported,
  requestFcmToken,
} from "@/lib/firebase/messaging";

const PROMPTED_KEY = "admin-fcm-prompted";
const REGISTERED_TOKEN_KEY = "admin-fcm-token";

async function saveFcmToken(token: string): Promise<boolean> {
  const response = await fetch("/api/admin/fcm-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return response.ok;
}

export function AdminPushInitializer() {
  const { user, loading } = useAuth();
  const initRef = useRef(false);

  useEffect(() => {
    if (loading || !user || initRef.current) return;
    initRef.current = true;

    void (async () => {
      const supported = await isMessagingSupported();
      if (!supported || typeof window === "undefined") return;

      if (!("Notification" in window)) return;

      const permission = Notification.permission;

      if (permission === "denied") {
        return;
      }

      if (permission === "default") {
        const alreadyPrompted = sessionStorage.getItem(PROMPTED_KEY) === "1";
        if (alreadyPrompted) return;
        sessionStorage.setItem(PROMPTED_KEY, "1");
        const result = await Notification.requestPermission();
        if (result !== "granted") return;
      }

      const token = await requestFcmToken();
      if (!token) return;

      const previousToken = sessionStorage.getItem(REGISTERED_TOKEN_KEY);
      if (previousToken === token) return;

      const saved = await saveFcmToken(token);
      if (saved) {
        sessionStorage.setItem(REGISTERED_TOKEN_KEY, token);
      }
    })();
  }, [loading, user]);

  return null;
}
