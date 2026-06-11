"use client";

import { LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "@dakshinkali/auth";
import { useRouter } from "next/navigation";
import { NotificationBell } from "./notification-bell";

export function AdminTopbar({
  title,
  onMenuClick,
  onSearchClick,
}: {
  title: string;
  onMenuClick?: () => void;
  onSearchClick?: () => void;
}) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await signOut();
    router.replace("/login");
  }

  const displayName =
    profile?.full_name || user?.email?.split("@")[0] || "Admin";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate font-heading text-lg font-semibold text-gray-900">
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onSearchClick}
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100"
          aria-label="Search (Ctrl+K)"
          title="Search (Ctrl+K)"
        >
          <Search className="h-5 w-5" />
        </button>
        <NotificationBell />
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{user?.email}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
