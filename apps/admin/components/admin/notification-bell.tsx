"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Package } from "lucide-react";
import {
  formatNprPrice,
  formatRelativeTime,
} from "@/lib/admin/order-utils";
import {
  getOrderNotificationReadState,
  isOrderNotificationRead,
  markOrderNotificationRead,
  type OrderNotificationReadEntry,
} from "@/lib/admin/notifications/read-state";
import { useDeliveredOrderNotifications } from "@/lib/admin/notifications/use-delivered-order-notifications";
import { useLowStockProducts } from "@/lib/admin/notifications/use-low-stock-products";
import { useOrderNotifications } from "@/lib/admin/notifications/use-order-notifications";

function OrderPreviewImage({
  imageUrl,
  label,
}: {
  imageUrl: string | null;
  label: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={label}
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-md border border-gray-200 object-cover"
        unoptimized
      />
    );
  }

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-gray-500"
      aria-hidden="true"
    >
      <Package className="h-4 w-4" />
    </div>
  );
}

function ProductThumb({
  imageUrl,
  name,
}: {
  imageUrl: string | null;
  name: string;
}) {
  if (imageUrl) {
    return (
      <Image
        src={imageUrl}
        alt={name}
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-md border border-gray-200 object-cover"
        unoptimized
      />
    );
  }

  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-gray-200 bg-gray-100 text-xs font-semibold text-gray-500"
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function getOrderCardTitle(order: {
  order_items: { product_name: string }[];
  order_number: string;
}) {
  const firstProductName = order.order_items[0]?.product_name?.trim();
  if (!firstProductName) return `#${order.order_number}`;

  const remainingCount = order.order_items.length - 1;
  return remainingCount > 0
    ? `${firstProductName} +${remainingCount} more`
    : firstProductName;
}

export function NotificationBell() {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [lowStockExpanded, setLowStockExpanded] = useState(false);
  const [readEntries, setReadEntries] = useState<OrderNotificationReadEntry[]>([]);
  const { orders, loading: ordersLoading } = useOrderNotifications();
  const {
    notifications: deliveredNotifications,
    loading: deliveredLoading,
  } = useDeliveredOrderNotifications();
  const { products: lowStockProducts, loading: lowStockLoading } =
    useLowStockProducts();

  useEffect(() => {
    setReadEntries(getOrderNotificationReadState());
  }, []);

  const unreadCount =
    orders.filter(
      (order) => !isOrderNotificationRead(order.id, readEntries),
    ).length +
    deliveredNotifications.filter(
      (notification) =>
        !isOrderNotificationRead(notification.id, readEntries),
    ).length;

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  function handleOrderClick(orderId: string) {
    const nextReadEntries = markOrderNotificationRead(orderId);
    setReadEntries(nextReadEntries);
    setOpen(false);
    router.push(`/admin/orders/${orderId}`);
  }

  function handleDeliveredLink(notificationId: string) {
    const nextReadEntries = markOrderNotificationRead(notificationId);
    setReadEntries(nextReadEntries);
    setOpen(false);
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[min(70vh,520px)] overflow-y-auto rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
          <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Notifications
          </p>

          <div className="mt-2 border-b border-gray-100 pb-2">
            <button
              type="button"
              onClick={() => setLowStockExpanded((prev) => !prev)}
              className="group flex w-full items-center justify-between px-4 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 hover:bg-gray-50"
            >
              <span className="flex items-center gap-2">
                <span>Low Stock</span>
                {!lowStockLoading && lowStockProducts.length > 0 ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-800 normal-case">
                    {lowStockProducts.length}
                  </span>
                ) : null}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-normal lowercase text-gray-400">
                <span>{lowStockExpanded ? "hide" : "show"}</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-300 ease-in-out ${
                    lowStockExpanded ? "rotate-180 text-amber-500" : ""
                  } group-hover:translate-y-0.5`}
                />
              </span>
            </button>

            {lowStockExpanded ? (
              lowStockLoading ? (
                <p className="px-4 py-2 text-sm text-gray-400">Loading…</p>
              ) : lowStockProducts.length === 0 ? (
                <p className="px-4 py-2 text-sm text-gray-400">No low stock items</p>
              ) : (
                <ul className="mt-1">
                  {lowStockProducts.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50"
                      >
                        <ProductThumb
                          imageUrl={product.imageUrl}
                          name={product.name}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {product.name}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </div>

          <div className="mt-2">
            {deliveredLoading ? (
              <p className="px-4 py-2 text-sm text-gray-400">
                Loading delivered orders…
              </p>
            ) : deliveredNotifications.length > 0 ? (
              <ul className="border-b border-gray-100 pb-2">
                {deliveredNotifications.map((notification) => {
                  const unread = !isOrderNotificationRead(
                    notification.id,
                    readEntries,
                  );

                  return (
                    <li
                      key={notification.id}
                      className={`px-4 py-3 ${
                        unread ? "bg-primary/5" : "opacity-60"
                      }`}
                    >
                      <p className="text-sm font-semibold text-gray-900">
                        {notification.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-600">
                        {notification.message}
                      </p>
                      <div className="mt-2 space-y-1">
                        {notification.metadata.items.map((item, index) => (
                          <Link
                            key={`${notification.id}-${item.product_id}-${index}`}
                            href={item.hisabkitab_url}
                            onClick={() =>
                              handleDeliveredLink(notification.id)
                            }
                            className="block text-xs font-semibold text-primary hover:underline"
                          >
                            Open {item.product_name} in HisabKitab
                          </Link>
                        ))}
                      </div>
                      <p className="mt-2 text-[11px] text-gray-400">
                        {formatRelativeTime(notification.created_at)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            ) : null}

            {ordersLoading ? (
              <p className="px-4 py-2 text-sm text-gray-400">Loading orders…</p>
            ) : orders.length === 0 ? (
              <p className="px-4 py-2 text-sm text-gray-400">
                No pending order notifications
              </p>
            ) : (
              <ul>
                {orders.map((order) => {
                  const unread = !isOrderNotificationRead(order.id, readEntries);
                  const previewImage =
                    order.order_items[0]?.product_image_url ?? null;
                  const previewLabel =
                    order.order_items[0]?.product_name ?? order.order_number;
                  const title = getOrderCardTitle(order);

                  return (
                    <li key={order.id}>
                      <button
                        type="button"
                        onClick={() => handleOrderClick(order.id)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 ${
                          unread ? "bg-primary/5" : "opacity-60 grayscale"
                        }`}
                      >
                        <OrderPreviewImage
                          imageUrl={previewImage}
                          label={previewLabel}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {title} · {order.customer_name}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {formatNprPrice(order.total)}
                          </p>
                        </div>
                        <span className="shrink-0 text-[11px] text-gray-400">
                          {formatRelativeTime(order.created_at)}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
