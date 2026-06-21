"use client";

import { LogOut, Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { HisabKitabUserContext } from "@/lib/auth/permissions";

export function Topbar({
  user,
  onMenuClick,
}: {
  user: HisabKitabUserContext;
  onMenuClick?: () => void;
}) {
  const router = useRouter();
  const displayName = user.fullName || user.email?.split("@")[0] || "User";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="size-5" />
        </button>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            HisabKitab Phase 1
          </p>
          <p className="truncate text-xs text-slate-500">
            {user.role === "admin" ? "Admin access" : "Staff access"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-950">{displayName}</p>
          <p className="text-xs text-slate-500">{user.email}</p>
        </div>
        <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {displayName.charAt(0).toUpperCase()}
        </div>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
