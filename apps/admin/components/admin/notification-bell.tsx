"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import type { AdminNotificationCounts } from "@/lib/admin/actions/notifications";

type NotificationRow = {
  key: string;
  label: string;
  count: number;
  href: string;
};

export function NotificationBell({
  counts,
}: {
  counts: AdminNotificationCounts;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const rows: NotificationRow[] = [
    {
      key: "approval",
      label: "Orders awaiting approval",
      count: counts.pendingVerification + counts.pendingApproval,
      href: "/admin/orders/approval",
    },
    {
      key: "outOfStock",
      label: "Out of stock",
      count: counts.outOfStock,
      href: "/admin/products?status=out_of_stock",
    },
    {
      key: "lowStock",
      label: "Low stock",
      count: counts.lowStock,
      href: "/admin/products?status=low_stock",
    },
  ];

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!panelRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-gray-600 hover:bg-gray-100"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {counts.total > 0 ? (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {counts.total > 99 ? "99+" : counts.total}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
          <p className="px-4 py-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Notifications
          </p>
          <ul className="mt-1">
            {rows.map((row) => (
              <li key={row.key}>
                <Link
                  href={row.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 ${
                    row.count === 0 ? "text-gray-400" : "text-gray-900"
                  }`}
                >
                  <span>{row.label}</span>
                  <span
                    className={
                      row.count > 0
                        ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary"
                        : "text-xs text-gray-400"
                    }
                  >
                    {row.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-2 border-t border-gray-100 px-4 pt-2">
            <Link
              href="/admin/orders"
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-primary hover:underline"
            >
              View all orders
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
