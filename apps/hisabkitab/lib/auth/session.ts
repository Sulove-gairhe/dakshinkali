import { cookies } from "next/headers";

export const PRIVACY_MODE_SESSION_COOKIE = "hisabkitab_privacy_mode";

export type SessionPrivacyOverride = boolean | null;

export function parseSessionPrivacyOverride(value: string | undefined) {
  if (value === "on") {
    return true;
  }

  if (value === "off") {
    return false;
  }

  return null;
}

export async function getSessionPrivacyOverride(): Promise<SessionPrivacyOverride> {
  const cookieStore = await cookies();
  return parseSessionPrivacyOverride(
    cookieStore.get(PRIVACY_MODE_SESSION_COOKIE)?.value,
  );
}

export async function setSessionPrivacyOverride(value: SessionPrivacyOverride) {
  const cookieStore = await cookies();

  if (value === null) {
    cookieStore.delete(PRIVACY_MODE_SESSION_COOKIE);
    return;
  }

  cookieStore.set(PRIVACY_MODE_SESSION_COOKIE, value ? "on" : "off", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}
