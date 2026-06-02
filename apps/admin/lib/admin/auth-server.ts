import { createClient } from "@/lib/supabase/server";
import { isAdminRole, isSuperAdmin } from "@/lib/auth-urls";

export async function requireAdminUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Authentication required");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  if (!isAdminRole(profile?.role)) {
    throw new Error("Admin access required");
  }

  return { supabase, user, profile };
}

export async function requireSuperAdmin() {
  const session = await requireAdminUser();

  if (!isSuperAdmin(session.profile?.role)) {
    throw new Error("Super admin access required");
  }

  return session;
}
