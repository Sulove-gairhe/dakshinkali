"use client";

import { Suspense, useCallback, useState } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";
import {
  CommandPalette,
  useCommandPaletteShortcut,
} from "./command-palette";

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
    <div className="flex min-h-screen bg-gray-50">
      <Suspense fallback={<div className="hidden w-64 lg:block" />}>
        <AdminSidebar open={mobileOpen} onClose={() => setMobileOpen(false)} />
      </Suspense>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          title={title}
          onMenuClick={() => setMobileOpen(true)}
          onSearchClick={openCommand}
        />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
      <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
