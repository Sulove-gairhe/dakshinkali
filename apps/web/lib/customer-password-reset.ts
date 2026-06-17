"use server";

import "server-only";

import crypto from "crypto";
import { headers } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

const RESET_PURPOSE = "customer_password_reset";
const RESET_TTL_MINUTES = 30;
const RESET_FROM = "Dakshinkali Electro <noreply@dakshinkali.shop>";

export type CustomerPasswordResetResult =
  | { status: "success"; message: string; redirectTo?: string }
  | { status: "error"; message: string };

type AuthUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z
  .object({
    email: z.string().email(),
    token: z.string().min(20, "Password reset link is invalid or expired."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getResetSecret() {
  const secret = process.env.ADMIN_EMAIL_OTP_SECRET;
  if (!secret || secret === "replace-with-strong-random-secret") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_EMAIL_OTP_SECRET is required in production.");
    }

    return "development-storefront-password-reset-secret";
  }

  return secret;
}

function hashToken(email: string, token: string) {
  return crypto
    .createHmac("sha256", getResetSecret())
    .update(`${RESET_PURPOSE}:${email}:${token}`)
    .digest("hex");
}

function generateResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function createServiceClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing server Supabase env: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function tryCreateServiceClient() {
  try {
    return createServiceClient();
  } catch (error) {
    console.warn("[CUSTOMER_PASSWORD_RESET_SERVICE_CLIENT_UNAVAILABLE]", error);
    return null;
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getRole(user: AuthUser) {
  const role = user.app_metadata?.role || user.user_metadata?.role;
  return typeof role === "string" ? role : null;
}

async function findCustomerAuthUserByEmail(email: string) {
  const supabase = tryCreateServiceClient();
  if (!supabase) return null;

  const normalizedEmail = normalizeEmail(email);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (profile?.role === "admin" || profile?.role === "staff") {
    return null;
  }

  if (profile?.id && profile.email) {
    const { data } = await supabase.auth.admin.getUserById(profile.id);
    const role = data.user ? getRole(data.user as AuthUser) : null;
    if (
      data.user?.email?.toLowerCase() === normalizedEmail &&
      role !== "admin" &&
      role !== "staff"
    ) {
      return data.user as AuthUser;
    }
  }

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) return null;

    const match = (data.users as AuthUser[]).find(
      (user) => user.email?.toLowerCase() === normalizedEmail,
    );

    if (match) {
      const role = getRole(match);
      return role === "admin" || role === "staff" ? null : match;
    }

    if (data.users.length < 1000) break;
  }

  return null;
}

async function getResetUrlBase() {
  const headerStore = await headers();
  const origin =
    headerStore.get("origin") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000";

  return `${origin}/reset-password`;
}

function buildPasswordResetText(resetUrl: string) {
  return `Dakshinkali password reset

Create a new password using this secure link:
${resetUrl}

This link expires in ${RESET_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.`;
}

function buildPasswordResetHtml(resetUrl: string) {
  const safeResetUrl = escapeHtml(resetUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dakshinkali password reset</title>
  </head>
  <body style="margin:0; padding:0; background:#f3f6fb; font-family:Arial, Helvetica, sans-serif; color:#172033;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border:1px solid #e6edf5; border-radius:16px; overflow:hidden; box-shadow:0 18px 45px rgba(23,32,51,0.08);">
            <tr>
              <td style="background:#0f6b8f; padding:28px 32px;">
                <p style="margin:0; color:#c9f2ff; font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Dakshinkali Electro</p>
                <h1 style="margin:10px 0 0; color:#ffffff; font-size:24px; line-height:1.25; font-weight:700;">Create a new password</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 22px; color:#405069; font-size:15px; line-height:1.6;">
                  Use the secure button below to create a new password for your storefront account.
                </p>
                <a href="${safeResetUrl}" style="display:inline-block; background:#0f6b8f; color:#ffffff; text-decoration:none; border-radius:10px; padding:14px 20px; font-size:15px; font-weight:700;">
                  Create New Password
                </a>
                <p style="margin:24px 0 12px; color:#64748b; font-size:13px; line-height:1.6;">
                  This link expires in <strong>${RESET_TTL_MINUTES} minutes</strong>. If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin:0; padding:14px 16px; border-radius:12px; background:#f8fbff; border:1px solid #dce7f3; color:#0f6b8f; font-size:13px; line-height:1.5; word-break:break-all;">
                  ${safeResetUrl}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESET_FROM,
      to: normalizeEmail(email),
      subject: "Create a new Dakshinkali password",
      text: buildPasswordResetText(resetUrl),
      html: buildPasswordResetHtml(resetUrl),
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend failed with HTTP ${response.status}`);
  }
}

async function createResetChallenge(email: string) {
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    throw new Error("Supabase service role is not configured.");
  }

  const normalizedEmail = normalizeEmail(email);
  const token = generateResetToken();
  const expiresAt = new Date(
    Date.now() + RESET_TTL_MINUTES * 60 * 1000,
  ).toISOString();
  const resetUrlBase = await getResetUrlBase();
  const resetUrl = `${resetUrlBase}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(normalizedEmail)}`;

  const { error } = await supabase.from("admin_email_otp_challenges").insert({
    email: normalizedEmail,
    purpose: RESET_PURPOSE,
    otp_hash: hashToken(normalizedEmail, token),
    expires_at: expiresAt,
    max_attempts: 1,
  });

  if (error) throw error;

  await sendPasswordResetEmail(normalizedEmail, resetUrl);
}

async function consumeResetChallenge(email: string, token: string) {
  const supabase = tryCreateServiceClient();
  if (!supabase) return false;

  const normalizedEmail = normalizeEmail(email);
  const { data: challenge, error } = await supabase
    .from("admin_email_otp_challenges")
    .select("id, otp_hash, attempts, max_attempts, expires_at, consumed_at")
    .eq("email", normalizedEmail)
    .eq("purpose", RESET_PURPOSE)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !challenge) return false;

  const attempts = Number(challenge.attempts ?? 0);
  const maxAttempts = Number(challenge.max_attempts ?? 1);
  if (
    challenge.consumed_at ||
    attempts >= maxAttempts ||
    new Date(challenge.expires_at).getTime() < Date.now()
  ) {
    return false;
  }

  const expectedHash = hashToken(normalizedEmail, token.trim());
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = Buffer.from(String(challenge.otp_hash), "hex");
  const matches =
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer);

  await supabase
    .from("admin_email_otp_challenges")
    .update(
      matches
        ? {
            consumed_at: new Date().toISOString(),
            attempts: attempts + 1,
          }
        : { attempts: attempts + 1 },
    )
    .eq("id", challenge.id);

  return matches;
}

export async function requestCustomerPasswordReset(
  formData: FormData,
): Promise<CustomerPasswordResetResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Enter a valid email address." };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await findCustomerAuthUserByEmail(email);
  if (!user) {
    return { status: "error", message: "No storefront account exists for that email." };
  }

  try {
    await createResetChallenge(email);
  } catch (error) {
    console.warn("[CUSTOMER_PASSWORD_RESET_SEND_FAILED]", error);
    return { status: "error", message: "Unable to send password reset email." };
  }

  return { status: "success", message: "Password reset link has been sent." };
}

export async function resetCustomerPassword(
  formData: FormData,
): Promise<CustomerPasswordResetResult> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message:
        parsed.error.issues[0]?.message ?? "Password reset link is invalid or expired.",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const user = await findCustomerAuthUserByEmail(email);
  if (!user) {
    return { status: "error", message: "Password reset link is invalid or expired." };
  }

  const verified = await consumeResetChallenge(email, parsed.data.token);
  if (!verified) {
    return { status: "error", message: "Password reset link is invalid or expired." };
  }

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return { status: "error", message: "Supabase service role is not configured." };
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password: parsed.data.password,
  });

  if (error) {
    console.warn("[CUSTOMER_PASSWORD_RESET_UPDATE_FAILED]", error);
    return { status: "error", message: "Unable to update password." };
  }

  return {
    status: "success",
    message: "Password updated. You can now sign in.",
    redirectTo: "/login",
  };
}
