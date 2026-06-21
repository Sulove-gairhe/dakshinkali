import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  hasAnyHisabKitabPermission,
  parseStaffPermissions,
  type HisabKitabUserContext,
} from "./permissions";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string | null;
  staff_permissions: unknown;
};

export class HisabKitabForbiddenError extends Error {
  constructor(message = "HisabKitab access denied") {
    super(message);
    this.name = "HisabKitabForbiddenError";
  }
}

export async function requireHisabKitabUser(): Promise<HisabKitabUserContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const authUser = user;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, staff_permissions")
    .eq("id", authUser.id)
    .maybeSingle<ProfileRow>();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const role = profile?.role;
  if (role !== "admin" && role !== "staff") {
    throw new HisabKitabForbiddenError("Only admin and explicitly granted staff can access HisabKitab.");
  }

  const context = {
    userId: authUser.id,
    email: profile?.email ?? authUser.email ?? null,
    role,
    fullName: profile?.full_name ?? null,
    staffPermissions: parseStaffPermissions(profile?.staff_permissions),
    isAdmin: role === "admin",
  } satisfies HisabKitabUserContext;

  if (!hasAnyHisabKitabPermission(context)) {
    throw new HisabKitabForbiddenError("Staff need explicit HisabKitab permissions.");
  }

  return context;
}
