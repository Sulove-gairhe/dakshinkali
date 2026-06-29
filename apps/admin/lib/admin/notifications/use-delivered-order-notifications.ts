"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DeliveredOrderNotificationCard } from "./bell-types";
import { mapDeliveredOrderNotification } from "./delivered-notification-mapper";
import { upsertOrderNotificationEntry } from "./read-state";

const CUTOFF_MS = 48 * 60 * 60 * 1000;

export function useDeliveredOrderNotifications() {
  const [notifications, setNotifications] = useState<
    DeliveredOrderNotificationCard[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    const cutoff = new Date(Date.now() - CUTOFF_MS).toISOString();

    const mergeNotification = (row: Record<string, unknown>) => {
      const notification = mapDeliveredOrderNotification(row);
      if (!notification) return;

      upsertOrderNotificationEntry(notification.id, notification.created_at);
      setNotifications((previous) => {
        const remaining = previous.filter((item) => item.id !== notification.id);
        return [notification, ...remaining].sort(
          (a, b) =>
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime(),
        );
      });
    };

    void (async () => {
      const { data, error } = await supabase
        .from("admin_bell_notifications")
        .select("id,type,order_id,title,message,metadata,created_at")
        .eq("type", "delivered_order")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(25);

      if (cancelled) return;
      if (error) {
        console.warn("[DELIVERED_BELL_NOTIFICATIONS_LOAD_ERROR]", error.message);
        setLoading(false);
        return;
      }

      const mapped = (data ?? [])
        .map((row) =>
          mapDeliveredOrderNotification(row as Record<string, unknown>),
        )
        .filter(
          (item): item is DeliveredOrderNotificationCard => Boolean(item),
        );

      mapped.forEach((item) =>
        upsertOrderNotificationEntry(item.id, item.created_at),
      );
      setNotifications(mapped);
      setLoading(false);
    })();

    const channel = supabase
      .channel("admin-delivered-order-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "admin_bell_notifications",
          filter: "type=eq.delivered_order",
        },
        (payload) => mergeNotification(payload.new as Record<string, unknown>),
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { notifications, loading };
}
