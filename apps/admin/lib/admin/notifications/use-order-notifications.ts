"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderNotificationCard } from "./bell-types";
import type { OrderStatus, PaymentStatus } from "@/lib/admin/order-types";
import { upsertOrderNotificationEntry } from "./read-state";

const CACHE_KEY = "admin-order-notifications-cache";
const CUTOFF_MS = 48 * 60 * 60 * 1000; // 48 hours

function isDeliveredOrder(order: Pick<OrderNotificationCard, "status">) {
  return order.status === "delivered";
}

function loadCache(): OrderNotificationCard[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const now = Date.now();
    return parsed.filter((item: OrderNotificationCard) => {
      const time = new Date(item.created_at).getTime();
      return now - time < CUTOFF_MS && !isDeliveredOrder(item);
    });
  } catch {
    return [];
  }
}

function saveCache(list: OrderNotificationCard[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("Failed to save notifications cache", e);
  }
}

function saveNotifications(list: OrderNotificationCard[]) {
  saveCache(list);
  list.forEach((item) => {
    upsertOrderNotificationEntry(item.id, item.created_at);
  });
}

async function fetchOrderNotificationById(
  supabase: ReturnType<typeof createClient>,
  orderId: string,
) {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      customer_name,
      total,
      status,
      payment_status,
      created_at,
      order_items (
        product_name,
        product_image_url
      )
    `,
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn("[ORDER_NOTIFICATIONS_LOAD_ERROR]", error.message);
    return null;
  }

  return mapOrderRowFull(data as Record<string, unknown>);
}

function mapOrderRowFull(row: Record<string, unknown>): OrderNotificationCard {
  const status = row.status as OrderStatus;
  const paymentStatus = row.payment_status as PaymentStatus;

  const itemsRaw = row.order_items;
  const orderItems = Array.isArray(itemsRaw)
    ? itemsRaw.map((item) => {
        const record = item as Record<string, unknown>;
        return {
          product_name: String(record.product_name ?? ""),
          product_image_url:
            typeof record.product_image_url === "string"
              ? record.product_image_url
              : null,
        };
      })
    : [];

  return {
    id: String(row.id),
    order_number: String(row.order_number ?? ""),
    customer_name: String(row.customer_name ?? "Customer"),
    total: Number(row.total ?? 0),
    status,
    payment_status: paymentStatus,
    created_at: String(row.created_at ?? new Date().toISOString()),
    order_items: orderItems,
  };
}

export function useOrderNotifications() {
  const [orders, setOrders] = useState<OrderNotificationCard[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from cache initially
  useEffect(() => {
    const initial = loadCache();
    setOrders(initial);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    void (async () => {
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id,
          order_number,
          customer_name,
          total,
          status,
          payment_status,
          created_at,
          order_items (
            product_name,
            product_image_url
          )
        `,
        )
        .or(
          "status.eq.pending_admin_approval,payment_status.eq.pending_verification",
        )
        .order("created_at", { ascending: false })
        .limit(25);

      if (cancelled) return;

      if (error) {
        console.warn("[ORDER_NOTIFICATIONS_LOAD_ERROR]", error.message);
        setLoading(false);
        return;
      }

      const fetched = (data ?? []).map((row) => mapOrderRowFull(row as Record<string, unknown>));

      setOrders((prev) => {
        // Merge cached (prev) and fetched
        const mergedMap = new Map<string, OrderNotificationCard>();
        prev.forEach((item) => mergedMap.set(item.id, item));
        fetched.forEach((item) => {
          if (mergedMap.has(item.id)) {
            const existing = mergedMap.get(item.id)!;
            mergedMap.set(item.id, {
              ...item,
              created_at: existing.created_at,
            });
          } else {
            mergedMap.set(item.id, item);
          }
        });

        const now = Date.now();
        const mergedList = Array.from(mergedMap.values())
          .filter((item) => now - new Date(item.created_at).getTime() < CUTOFF_MS)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        saveNotifications(mergedList);
        return mergedList;
      });
      setLoading(false);
    })();

    const handleInsert = (row: Record<string, unknown>) => {
      const mapped = mapOrderRowFull(row);
      if (isDeliveredOrder(mapped)) return;

      // New realtime insert should have current timestamp
      mapped.created_at = new Date().toISOString();
      upsertOrderNotificationEntry(mapped.id, mapped.created_at);

      setOrders((prev) => {
        const without = prev.filter((item) => item.id !== mapped.id);
        const mergedList = [mapped, ...without].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        saveNotifications(mergedList);
        return mergedList;
      });

      window.setTimeout(() => {
        void (async () => {
          const fullOrder = await fetchOrderNotificationById(supabase, mapped.id);
          if (!fullOrder) return;

          setOrders((prev) => {
            const existing = prev.find((item) => item.id === fullOrder.id);
            const createdAt = existing?.created_at ?? mapped.created_at;
            const updated = { ...fullOrder, created_at: createdAt };
            const without = prev.filter((item) => item.id !== updated.id);
            const mergedList = [updated, ...without].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            );
            saveNotifications(mergedList);
            return mergedList;
          });
        })();
      }, 750);
    };

    const handleUpdate = (row: Record<string, unknown>) => {
      const mapped = mapOrderRowFull(row);

      setOrders((prev) => {
        if (isDeliveredOrder(mapped)) {
          const remaining = prev.filter((item) => item.id !== mapped.id);
          saveNotifications(remaining);
          return remaining;
        }

        const existing = prev.find((item) => item.id === mapped.id);
        const createdAt = existing ? existing.created_at : new Date().toISOString();
        const orderItems = (mapped.order_items && mapped.order_items.length > 0)
          ? mapped.order_items
          : (existing?.order_items ?? []);

        const updatedMapped = { ...mapped, created_at: createdAt, order_items: orderItems };

        const without = prev.filter((item) => item.id !== mapped.id);
        const mergedList = [updatedMapped, ...without].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        saveNotifications(mergedList);
        return mergedList;
      });
    };

    const channel = supabase
      .channel("admin-order-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          handleInsert(payload.new as Record<string, unknown>);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          handleUpdate(payload.new as Record<string, unknown>);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, []);

  return { orders, loading };
}
