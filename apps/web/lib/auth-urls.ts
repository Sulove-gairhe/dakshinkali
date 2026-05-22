const DEFAULT_POST_AUTH_PATH = "/account";

export function getSiteOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function getAuthCallbackUrl(nextPath = DEFAULT_POST_AUTH_PATH) {
  const origin = getSiteOrigin();
  const next = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function getEmailRedirectUrl(nextPath = DEFAULT_POST_AUTH_PATH) {
  return getAuthCallbackUrl(nextPath);
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

export function sanitizeNextPath(next: string | null | undefined) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return DEFAULT_POST_AUTH_PATH;
  }

  return next;
}
