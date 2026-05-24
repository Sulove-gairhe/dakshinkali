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

  if (role === "admin" || role === "customer") {
    return role;
  }

  return null;
}
