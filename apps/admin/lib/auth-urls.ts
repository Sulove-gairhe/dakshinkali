export function sanitizeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  return next;
}

export function decodeAuthMessage(value?: string) {
  if (!value) {
    return undefined;
  }

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function getUserRoleFromMetadata(user: {
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
}) {
  const role =
    user.app_metadata?.role || user.user_metadata?.role;

  if (role === "admin" || role === "staff" || role === "customer") {
    return role;
  }

  return null;
}

export type UserRole = "customer" | "staff" | "admin";

export function isAdminRole(role: string | null | undefined) {
  return role === "admin" || role === "staff";
}

export function isSuperAdmin(role: string | null | undefined) {
  return role === "admin";
}

export function getAdminUrl() {
  return (
    process.env.NEXT_PUBLIC_ADMIN_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3001"
      : "https://dakshinkali-admin.vercel.app")
  );
}

export function getWebUrl() {
  return (
    process.env.NEXT_PUBLIC_WEB_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://dakshinkali.shop")
  );
}
