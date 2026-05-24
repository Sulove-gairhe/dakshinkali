import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  buildLoginRedirectUrl,
  isAuthEntryPath,
  isProtectedCustomerPath,
} from "@/lib/auth-routes";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const { url: supabaseUrl, key: supabaseAnonKey } = getSupabaseEnv();

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isProtectedCustomerPath(pathname)) {
      return NextResponse.redirect(
        buildLoginRedirectUrl(request.nextUrl, pathname),
      );
    }

    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedCustomerPath(pathname)) {
    return NextResponse.redirect(
      buildLoginRedirectUrl(request.nextUrl, pathname),
    );
  }

  if (user && isAuthEntryPath(pathname) && pathname !== "/auth/callback") {
    const redirectTo = request.nextUrl.searchParams.get("redirectTo");
    const destination =
      redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
        ? redirectTo
        : "/account";
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return supabaseResponse;
}
