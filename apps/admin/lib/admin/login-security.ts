"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-server";
import { isAdminRole, type UserRole } from "@/lib/auth-urls";
import { requireSuperAdmin } from "@/lib/admin/auth-server";

const INVALID_CREDENTIALS = "Invalid credentials";
const UNABLE_TO_SIGN_IN = "Unable to complete sign in";

type AdminProfile = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  role: UserRole;
};

export type AdminPasswordSignInResult =
  | { status: "success"; redirectTo: string }
  | { status: "access_denied"; email: string; userId: string | null }
  | { status: "error"; message: string };

export type AdminAccessRequestResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export type AdminGrantAccessResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const grantAccessSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_-]{3,32}$/, "Use 3-32 lowercase letters, numbers, _ or -."),
  role: z.enum(["staff", "admin"]),
});

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function normalizeIdentifier(identifier: string) {
  const value = identifier.trim();
  return value.includes("@") ? normalizeEmail(value) : normalizeUsername(value);
}

function isEmailIdentifier(identifier: string) {
  return identifier.includes("@");
}

function tryCreateServiceClient() {
  try {
    return createServiceClient();
  } catch (error) {
    console.warn("[ADMIN_SERVICE_CLIENT_UNAVAILABLE]", error);
    return null;
  }
}

async function fetchProfileForCurrentUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, full_name, role")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AdminProfile;
}

async function resolveEmailFromIdentifier(identifier: string) {
  if (isEmailIdentifier(identifier)) {
    return {
      email: normalizeEmail(identifier),
      username: null,
      error: null,
    };
  }

  const username = normalizeUsername(identifier);
  if (!/^[a-z0-9_-]{3,32}$/.test(username)) {
    return { email: null, username, error: INVALID_CREDENTIALS };
  }

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return { email: null, username, error: UNABLE_TO_SIGN_IN };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .ilike("username", username)
    .maybeSingle();

  if (error || !data?.email) {
    return { email: null, username, error: INVALID_CREDENTIALS };
  }

  return { email: normalizeEmail(data.email), username, error: null };
}

async function applyAccessGrant(profile: AdminProfile) {
  if (!profile.email) {
    return null;
  }

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return null;
  }

  const email = normalizeEmail(profile.email);
  const { data: grant, error } = await supabase
    .from("admin_access_grants")
    .select("id, email, username, role")
    .eq("email", email)
    .maybeSingle();

  if (error || !grant?.role || !isAdminRole(grant.role)) {
    return null;
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update({
      role: grant.role,
      username: normalizeUsername(grant.username),
    })
    .eq("id", profile.id)
    .select("id, email, username, full_name, role")
    .maybeSingle();

  if (updateError || !updatedProfile) {
    return null;
  }

  await supabase
    .from("admin_access_grants")
    .update({
      accepted_user_id: profile.id,
      accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", grant.id);

  return updatedProfile as AdminProfile;
}

export async function adminPasswordSignIn(
  formData: FormData,
): Promise<AdminPasswordSignInResult> {
  const identifier = normalizeIdentifier(String(formData.get("identifier") ?? ""));
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  if (!identifier || !password) {
    return { status: "error", message: INVALID_CREDENTIALS };
  }

  const resolved = await resolveEmailFromIdentifier(identifier);
  if (resolved.error || !resolved.email) {
    return { status: "error", message: resolved.error ?? INVALID_CREDENTIALS };
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email: resolved.email,
    password,
  });

  if (error || !signInData.user) {
    return { status: "error", message: INVALID_CREDENTIALS };
  }

  const profile = await fetchProfileForCurrentUser(signInData.user.id);
  const grantedProfile =
    profile && !isAdminRole(profile.role) ? await applyAccessGrant(profile) : null;
  const effectiveProfile = grantedProfile ?? profile;

  if (!effectiveProfile || !isAdminRole(effectiveProfile.role)) {
    await supabase.auth.signOut();
    return {
      status: "access_denied",
      email: signInData.user.email ?? resolved.email,
      userId: signInData.user.id,
    };
  }

  return { status: "success", redirectTo: "/admin" };
}

export async function requestAdminAccess(
  formData: FormData,
): Promise<AdminAccessRequestResult> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const userId = String(formData.get("userId") ?? "") || null;

  if (!email) {
    return {
      status: "success",
      message: "Access request noted. Please contact the administrator.",
    };
  }

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    console.warn("[ADMIN_ACCESS_REQUEST]", { email, userId });
    return {
      status: "success",
      message: "Access request noted. Please contact the administrator.",
    };
  }

  await supabase.from("admin_access_requests").insert({
    email,
    user_id: userId,
    status: "pending",
  });

  return {
    status: "success",
    message: "Access request noted. Please contact the administrator.",
  };
}

export async function grantAdminAccess(
  formData: FormData,
): Promise<AdminGrantAccessResult> {
  const { user } = await requireSuperAdmin();
  const parsed = grantAccessSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.errors[0]?.message ?? "Invalid input" };
  }

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return { status: "error", message: "Admin service role is not configured." };
  }

  const email = normalizeEmail(parsed.data.email);
  const username = normalizeUsername(parsed.data.username);
  const role = parsed.data.role;

  const { data: existingUsername } = await supabase
    .from("profiles")
    .select("id")
    .ilike("username", username)
    .neq("email", email)
    .maybeSingle();

  if (existingUsername) {
    return { status: "error", message: "Username is already in use." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (profile?.id) {
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ username, role })
      .eq("id", profile.id);

    if (profileError) {
      return { status: "error", message: "Unable to update profile access." };
    }
  }

  const { error: grantError } = await supabase
    .from("admin_access_grants")
    .upsert(
      {
        email,
        username,
        role,
        granted_by: user.id,
        accepted_user_id: profile?.id ?? null,
        accepted_at: profile?.id ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

  if (grantError) {
    return { status: "error", message: "Unable to grant access." };
  }

  return {
    status: "success",
    message: "Access granted successfully. The user can now continue with their login credentials.",
  };
}
