const AUTH_ENTRY_PATHS = ["/login", "/signup", "/auth/callback"];
const PROTECTED_PATH_PREFIXES = ["/account"];

export function isAuthEntryPath(pathname: string) {
  return AUTH_ENTRY_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function isProtectedCustomerPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export function buildLoginRedirectUrl(requestUrl: URL, redirectTo: string) {
  const loginUrl = new URL("/login", requestUrl.origin);
  loginUrl.searchParams.set("redirectTo", redirectTo);
  return loginUrl;
}
