"use client";

import { Suspense, useCallback, useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import {
  CommandPalette,
  useCommandPaletteShortcut,
} from "./command-palette";
import { AdminPushInitializer } from "@/components/notifications/AdminPushInitializer";

export function AdminLayoutShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const openCommand = useCallback(() => setCommandOpen(true), []);
  useCommandPaletteShortcut(openCommand);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Suspense fallback={<div className="hidden w-64 lg:block" />}>
        <AdminSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AdminTopbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={openCommand}
        />
        <main className="flex flex-1 min-h-0 flex-col overflow-auto p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
      <AdminPushInitializer />
    </div>
  );
}
