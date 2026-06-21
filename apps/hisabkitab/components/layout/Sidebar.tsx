"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpenCheck,
  Boxes,
  ClipboardList,
  FileClock,
  Landmark,
  LayoutDashboard,
  ReceiptText,
  Settings,
  Truck,
  WalletCards,
  X,
} from "lucide-react";
import {
  HISABKITAB_PERMISSIONS,
  hasPermission,
  type HisabKitabUserContext,
} from "@/lib/auth/permissions";
import { cn } from "@/lib/utils/cn";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
    permission: HISABKITAB_PERMISSIONS.settings.view,
  },
  { href: "/inventory", label: "Inventory", icon: Boxes, phase: "Phase 2" },
  { href: "/stock-movements", label: "Stock Movements", icon: FileClock, phase: "Phase 2" },
  { href: "/suppliers", label: "Suppliers", icon: Truck, phase: "Phase 3" },
  { href: "/purchases", label: "Purchases", icon: ClipboardList, phase: "Phase 3" },
  { href: "/payments", label: "Payments", icon: WalletCards, phase: "Phase 4" },
  { href: "/accounts", label: "Accounts", icon: Landmark, phase: "Phase 4" },
  { href: "/ledger", label: "Ledger", icon: ReceiptText, phase: "Phase 4" },
  { href: "/reports", label: "Reports", icon: BarChart3, phase: "Phase 4" },
  { href: "/audit-logs", label: "Audit Logs", icon: BookOpenCheck, phase: "Phase 4" },
  { href: "/accounting", label: "Accounting", icon: Landmark, phase: "Phase 5" },
];

export function Sidebar({
  user,
  open,
  onClose,
}: {
  user: HisabKitabUserContext;
  open?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const content = (
    <aside className="flex h-full w-68 flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-500">
            Dakshinkali
          </p>
          <p className="font-semibold text-slate-950">HisabKitab</p>
        </div>
        {onClose ? (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X className="size-5" />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navItems.map((item) => {
          if (item.permission && !hasPermission(user, item.permission)) {
            return null;
          }

          const Icon = item.icon;
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition",
                active
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-transparent text-slate-700 hover:bg-slate-50",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.label}</span>
              {item.phase ? (
                <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
                  {item.phase}
                </span>
              ) : null}
            </Link>
          );
        })}
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
            aria-label="Close overlay"
            className="absolute inset-0 bg-black/40"
            onClick={onClose}
          />
          <div className="absolute left-0 top-0 h-full shadow-xl">{content}</div>
        </div>
      ) : null}
    </>
  );
}
