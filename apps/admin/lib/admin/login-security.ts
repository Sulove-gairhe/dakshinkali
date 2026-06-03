"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service-server";
import { isAdminRole, type UserRole } from "@/lib/auth-urls";
import { requireSuperAdmin } from "@/lib/admin/auth-server";
import {
  createAdminEmailOtpChallenge,
  verifyAdminEmailOtpChallenge,
} from "@/lib/admin/email-otp";

const CREDENTIALS_DONT_MATCH = "Credentials don't match";
const USERNAME_PATTERN = /^[a-z0-9_-]{3,32}$/;

type AdminProfile = {
  id: string;
  email: string | null;
  username: string | null;
  full_name: string | null;
  role: UserRole;
  created_at?: string | null;
};

type AdminAccessGrant = {
  id: string;
  email: string;
  username: string;
  role: "staff" | "admin";
};

type AdminAuthUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export type AdminPasswordSignInResult =
  | { status: "success"; redirectTo: string }
  | { status: "error"; message: string };

export type AdminSetupAccessResult =
  | { status: "success"; message: string; redirectTo?: string }
  | { status: "verify_email"; email: string; message: string }
  | { status: "error"; message: string };

export type AdminMember = {
  id: string;
  email: string;
  username: string | null;
  fullName: string | null;
  role: "staff" | "admin";
  createdAt: string | null;
};

export type AdminManageMembersResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const setupAccessBaseSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_PATTERN, "Credentials don't match"),
  password: z.string().min(8, "Credentials don't match"),
  confirmPassword: z.string(),
});

const setupAccessSchema = setupAccessBaseSchema
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Credentials don't match",
  });

const setupOtpSchema = setupAccessBaseSchema
  .extend({
    otp: z.string().regex(/^\d{6}$/, "Verification failed"),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Credentials don't match",
  });

const managedEmailSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_PATTERN, "Use 3-32 lowercase letters, numbers, _ or -."),
  role: z.enum(["staff", "admin"]),
});

const updateMemberRoleSchema = z.object({
  userId: z.string().uuid(),
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

async function getRequestMetadata() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  return {
    ipAddress: forwardedFor?.split(",")[0]?.trim() || null,
    userAgent: headerStore.get("user-agent"),
  };
}

async function resolveEmailFromIdentifier(identifier: string) {
  if (isEmailIdentifier(identifier)) {
    return normalizeEmail(identifier);
  }

  const username = normalizeUsername(identifier);
  if (!USERNAME_PATTERN.test(username)) {
    return null;
  }

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("email")
    .ilike("username", username)
    .maybeSingle();

  if (error || !data?.email) {
    return null;
  }

  return normalizeEmail(data.email);
}

async function fetchProfileForCurrentUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, full_name, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as AdminProfile;
}

async function fetchAccessGrant(email: string) {
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("admin_access_grants")
    .select("id, email, username, role")
    .eq("email", normalizeEmail(email))
    .maybeSingle();

  if (error || !data?.role || !isAdminRole(data.role)) {
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    username: normalizeUsername(data.username),
    role: data.role as "staff" | "admin",
  } satisfies AdminAccessGrant;
}

async function updateAuthRole(userId: string, role: "staff" | "admin") {
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return;
  }

  const { data } = await supabase.auth.admin.getUserById(userId);
  await supabase.auth.admin.updateUserById(userId, {
    app_metadata: {
      ...(data.user?.app_metadata ?? {}),
      role,
    },
    user_metadata: {
      ...(data.user?.user_metadata ?? {}),
      role,
    },
  });
}

async function updateProfileRoleAndUsername(input: {
  userId: string;
  email: string;
  role: "staff" | "admin";
  username: string;
}) {
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        id: input.userId,
        email: normalizeEmail(input.email),
        role: input.role,
        username: normalizeUsername(input.username),
      },
      { onConflict: "id" },
    )
    .select("id, email, username, full_name, role, created_at")
    .maybeSingle();

  if (error || !data) {
    console.warn("[ADMIN_PROFILE_ROLE_UPDATE_FAILED]", error);
    return null;
  }

  await updateAuthRole(input.userId, input.role);
  return data as AdminProfile;
}

async function createOrUpdateStaffAccount(input: {
  email: string;
  username: string;
  password: string;
  role: "staff" | "admin";
}) {
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return null;
  }

  const email = normalizeEmail(input.email);
  const username = normalizeUsername(input.username);
  const { data: existingUserList, error: listError } = await supabase.auth.admin.listUsers();
  const users = (existingUserList?.users ?? []) as AdminAuthUser[];
  const existingUser = listError
    ? null
    : users.find(
        (candidate) => candidate.email?.toLowerCase() === email,
      );

  const { data: authUser, error: authError } = existingUser
    ? await supabase.auth.admin.updateUserById(existingUser.id, {
        password: input.password,
        email_confirm: true,
        app_metadata: {
          ...(existingUser.app_metadata ?? {}),
          role: input.role,
        },
        user_metadata: {
          ...(existingUser.user_metadata ?? {}),
          username,
          role: input.role,
        },
      })
    : await supabase.auth.admin.createUser({
        email,
        password: input.password,
        email_confirm: true,
        app_metadata: { role: input.role },
        user_metadata: { username },
      });

  if (authError || !authUser.user?.id) {
    console.warn("[ADMIN_SETUP_AUTH_USER_UPSERT_FAILED]", authError);
    return null;
  }

  const profile = await updateProfileRoleAndUsername({
    userId: authUser.user.id,
    email,
    role: input.role,
    username,
  });

  if (!profile || !isAdminRole(profile.role)) {
    return null;
  }

  return profile;
}

async function signInSetupUser(email: string, password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });

  return !error;
}

export async function adminPasswordSignIn(
  formData: FormData,
): Promise<AdminPasswordSignInResult> {
  const identifier = normalizeIdentifier(String(formData.get("identifier") ?? ""));
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();

  if (!identifier || !password) {
    return { status: "error", message: CREDENTIALS_DONT_MATCH };
  }

  const email = await resolveEmailFromIdentifier(identifier);
  if (!email) {
    return { status: "error", message: CREDENTIALS_DONT_MATCH };
  }

  const { data: signInData, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !signInData.user) {
    return { status: "error", message: CREDENTIALS_DONT_MATCH };
  }

  const profile = await fetchProfileForCurrentUser(signInData.user.id);
  if (!profile || !isAdminRole(profile.role)) {
    const grant = await fetchAccessGrant(email);
    if (grant) {
      const updatedProfile = await updateProfileRoleAndUsername({
        userId: profile?.id ?? signInData.user.id,
        email,
        role: grant.role,
        username: grant.username,
      });

      if (updatedProfile && isAdminRole(updatedProfile.role)) {
        const service = tryCreateServiceClient();
        if (service) {
          await service
            .from("admin_access_grants")
            .update({
              accepted_user_id: updatedProfile.id,
              accepted_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", grant.id);
        }

        return { status: "success", redirectTo: "/admin" };
      }
    }

    await supabase.auth.signOut();
    return { status: "error", message: CREDENTIALS_DONT_MATCH };
  }

  return { status: "success", redirectTo: "/admin" };
}

export async function beginAdminSetupAccess(
  formData: FormData,
): Promise<AdminSetupAccessResult> {
  const parsed = setupAccessSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { status: "error", message: CREDENTIALS_DONT_MATCH };
  }

  const email = normalizeEmail(parsed.data.email);
  const username = normalizeUsername(parsed.data.username);
  const grant = await fetchAccessGrant(email);

  if (grant) {
    const profile = await createOrUpdateStaffAccount({
      email,
      username: grant.username,
      password: parsed.data.password,
      role: grant.role,
    });

    if (!profile) {
      return { status: "error", message: "Unable to complete verification" };
    }

    const service = tryCreateServiceClient();
    if (service) {
      await service
        .from("admin_access_grants")
        .update({
          accepted_user_id: profile.id,
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", grant.id);
    }

    const signedIn = await signInSetupUser(email, parsed.data.password);
    return signedIn
      ? {
          status: "success",
          message: "Setup complete.",
          redirectTo: "/admin",
        }
      : {
          status: "success",
          message: "Setup complete. You can now sign in.",
          redirectTo: "/login",
        };
  }

  try {
    const metadata = await getRequestMetadata();
    await createAdminEmailOtpChallenge({
      email,
      purpose: "new_user_setup",
      ...metadata,
    });
  } catch (error) {
    console.warn("[ADMIN_SETUP_OTP_SEND_FAILED]", error);
    return { status: "error", message: "Unable to complete verification" };
  }

  return {
    status: "verify_email",
    email,
    message: "An approval code was sent to the administrator.",
  };
}

export async function verifyAdminSetupAccessOtp(
  formData: FormData,
): Promise<AdminSetupAccessResult> {
  const parsed = setupOtpSchema.safeParse({
    email: formData.get("email"),
    username: formData.get("username"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    otp: formData.get("otp"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Verification failed" };
  }

  const email = normalizeEmail(parsed.data.email);
  const username = normalizeUsername(parsed.data.username);
  const grant = await fetchAccessGrant(email);
  const metadata = await getRequestMetadata();
  const verified = await verifyAdminEmailOtpChallenge({
    email,
    otp: parsed.data.otp,
    purpose: "new_user_setup",
    consume: false,
    ...metadata,
  });

  if (!verified) {
    return { status: "error", message: "Verification failed" };
  }

  const role = grant?.role ?? "staff";
  const grantedUsername = grant?.username ?? username;
  const profile = await createOrUpdateStaffAccount({
    email,
    password: parsed.data.password,
    role,
    username: grantedUsername,
  });

  if (!profile || !isAdminRole(profile.role)) {
    return { status: "error", message: "Unable to complete verification" };
  }

  await verifyAdminEmailOtpChallenge({
    email,
    otp: parsed.data.otp,
    purpose: "new_user_setup",
    ...metadata,
  });

  if (grant) {
    const service = tryCreateServiceClient();
    if (service) {
      await service
        .from("admin_access_grants")
        .update({
          accepted_user_id: profile.id,
          accepted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", grant.id);
    }
  }

  const signedIn = await signInSetupUser(email, parsed.data.password);

  return {
    status: "success",
    message: "Setup complete.",
    redirectTo: signedIn ? "/admin" : "/login",
  };
}

export async function addManagedStaffEmail(
  formData: FormData,
): Promise<AdminManageMembersResult> {
  const { user } = await requireSuperAdmin();
  const parsed = managedEmailSchema.safeParse({
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
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (profile?.id) {
    const updated = await updateProfileRoleAndUsername({
      userId: profile.id,
      email,
      role,
      username,
    });

    if (!updated) {
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

export async function updateAdminMemberRole(
  formData: FormData,
): Promise<AdminManageMembersResult> {
  const parsed = updateMemberRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Invalid member role." };
  }

  const { user } = await requireSuperAdmin();
  if (parsed.data.userId === user.id && parsed.data.role !== "admin") {
    return { status: "error", message: "You cannot demote your own admin account." };
  }

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return { status: "error", message: "Admin service role is not configured." };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.userId)
    .select("id, email, username, full_name, role")
    .maybeSingle();

  if (error || !profile?.email || !isAdminRole(profile.role)) {
    return { status: "error", message: "Unable to update role." };
  }

  await updateAuthRole(parsed.data.userId, parsed.data.role);

  await supabase
    .from("admin_access_grants")
    .upsert(
      {
        email: normalizeEmail(profile.email),
        username: profile.username ?? normalizeEmail(profile.email).split("@")[0],
        role: parsed.data.role,
        granted_by: user.id,
        accepted_user_id: parsed.data.userId,
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

  return { status: "success", message: "Member role updated." };
}

export async function getAdminMembers(): Promise<AdminMember[]> {
  await requireSuperAdmin();
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, username, full_name, role, created_at")
    .in("role", ["staff", "admin"])
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.warn("[ADMIN_MEMBERS_FETCH_FAILED]", error);
    return [];
  }

  return data
    .filter((profile) => isAdminRole(profile.role))
    .map((profile) => ({
      id: profile.id,
      email: profile.email,
      username: profile.username ?? null,
      fullName: profile.full_name ?? null,
      role: profile.role as "staff" | "admin",
      createdAt: profile.created_at ?? null,
    }));
}
