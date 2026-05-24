"use client";

import { AuthProvider } from "@dakshinkali/auth";

export function AdminProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
