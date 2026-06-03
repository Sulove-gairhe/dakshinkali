"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  Columns3,
  FileText,
  LayoutDashboard,
  Layers,
  ShieldPlus,
  Package,
  Tag,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { useAdminNavCounts } from "./admin-nav-provider";

const mainNav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  {
    href: "/admin/products",
    label: "Storefront Authoring",
    icon: Layers,
  },
];

const orderLinks = [
  { href: "/admin/orders", label: "All Orders", badgeKey: null },
  {
    href: "/admin/orders?paymentStatus=pending_verification",
    label: "Awaiting Review",
    badgeKey: "pendingVerification" as const,
  },
  {
    href: "/admin/orders?status=pending_admin_approval",
    label: "Awaiting Approval",
    badgeKey: "pendingApproval" as const,
  },
  { href: "/admin/orders/board", label: "Fulfillment Board", badgeKey: null },
] as const;

export function AdminSidebar({
  open,
  onClose,
}: {
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const counts = useAdminNavCounts();
  const isSuperAdmin = counts.role === "admin";

  const content = (
    <aside className="flex h-full w-64 flex-col border-r border-gray-200 bg-white">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Dakshinkali
          </p>
          <p className="font-semibold text-gray-900">Admin Panel</p>
        </div>
        {onClose ? (
          <button
            type="button"
            className="rounded-md p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-l-4 border-amber-500 bg-amber-50 text-amber-900"
                  : "border-l-4 border-transparent text-gray-700 hover:bg-gray-50",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4">
          <p className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <ClipboardList className="h-3.5 w-3.5" />
            Orders
          </p>
          {orderLinks.map((item) => {
            const active = (() => {
              if (item.href === "/admin/orders/board") {
                return pathname.startsWith("/admin/orders/board");
              }
              if (item.href.includes("paymentStatus=pending_verification")) {
                return (
                  pathname === "/admin/orders" &&
                  searchParams.get("paymentStatus") === "pending_verification"
                );
              }
              if (item.href.includes("status=pending_admin_approval")) {
                return (
                  pathname === "/admin/orders" &&
                  searchParams.get("status") === "pending_admin_approval"
                );
              }
              return (
                pathname === "/admin/orders" &&
                !searchParams.get("paymentStatus") &&
                !searchParams.get("status")
              );
            })();
            const badge =
              item.badgeKey === "pendingVerification"
                ? counts.pendingVerification
                : item.badgeKey === "pendingApproval"
                  ? counts.pendingApproval
                  : 0;

            return (
              <Link
                key={item.href + item.label}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center justify-between rounded-lg py-2 pl-8 pr-3 text-sm transition-colors",
                  active
                    ? "bg-amber-50 font-medium text-amber-900"
                    : "text-gray-700 hover:bg-gray-50",
                )}
              >
                <span className="flex items-center gap-2">
                  {item.label === "Fulfillment Board" ? (
                    <Columns3 className="h-3.5 w-3.5" />
                  ) : null}
                  {item.label}
                </span>
                {badge > 0 ? (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-gray-900">
                    {badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>

        {isSuperAdmin ? (
          <div className="pt-4">
            <p className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              <ShieldPlus className="h-3.5 w-3.5" />
              Manage
            </p>
            <Link
              href="/admin/manage/staff"
              onClick={onClose}
              className={cn(
                "flex items-center gap-2 rounded-lg py-2 pl-8 pr-3 text-sm transition-colors",
                pathname.startsWith("/admin/manage/staff")
                  ? "bg-amber-50 font-medium text-amber-900"
                  : "text-gray-700 hover:bg-gray-50",
              )}
            >
              <ShieldPlus className="h-3.5 w-3.5" />
              Staff Access
            </Link>
          </div>
        ) : null}
      </nav>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:block">{content}</div>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
            aria-label="Close overlay"
          />
          <div className="absolute left-0 top-0 h-full shadow-xl">{content}</div>
        </div>
      ) : null}
    </>
  );
}
