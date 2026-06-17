import "server-only";

import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase/service-server";

type OtpPurpose = "new_user_setup" | "password_reset";

const OTP_TTL_MINUTES = 5;
const OTP_DIGITS = 6;
const OTP_MAX_ATTEMPTS = 5;
const PASSWORD_RESET_TTL_MINUTES = 30;
const ADMIN_RESEND_FROM = "Dakshinkali Electro <noreply@dakshinkali.shop>";

export type CreateAdminEmailOtpInput = {
  email: string;
  purpose: OtpPurpose;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type VerifyAdminEmailOtpInput = {
  email: string;
  otp: string;
  purpose: OtpPurpose;
  ipAddress?: string | null;
  userAgent?: string | null;
  consume?: boolean;
};

function tryCreateServiceClient() {
  try {
    return createServiceClient();
  } catch (error) {
    console.warn("[ADMIN_EMAIL_OTP_SERVICE_CLIENT_UNAVAILABLE]", error);
    return null;
  }
}

function getOtpSecret() {
  const secret = process.env.ADMIN_EMAIL_OTP_SECRET;
  if (!secret || secret === "replace-with-strong-random-secret") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_EMAIL_OTP_SECRET is required in production.");
    }

    return "development-admin-email-otp-secret";
  }

  return secret;
}

function hashOtp(email: string, otp: string, purpose: OtpPurpose) {
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${purpose}:${email}:${otp}`)
    .digest("hex");
}

function hashToken(email: string, token: string, purpose: OtpPurpose) {
  return crypto
    .createHmac("sha256", getOtpSecret())
    .update(`${purpose}:${email}:${token}`)
    .digest("hex");
}

function generateOtp() {
  const min = 10 ** (OTP_DIGITS - 1);
  const max = 10 ** OTP_DIGITS;
  return String(crypto.randomInt(min, max));
}

function generateResetToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getAdminOtpRecipient() {
  const recipient =
    process.env.ADMIN_EMAIL_OTP_RECIPIENT ||
    process.env.ADMIN_EMAIL_TO;

  if (!recipient) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("ADMIN_EMAIL_OTP_RECIPIENT is required in production.");
    }

    return "admin@dakshinkali.shop";
  }

  return recipient;
}

async function sendWithResend(input: {
  deliveryEmail: string;
  subject: string;
  text: string;
  html: string;
}) {
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
      from: ADMIN_RESEND_FROM,
      to: input.deliveryEmail,
      subject: input.subject,
      text: input.text,
      html: input.html,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend failed with HTTP ${response.status}`);
  }
}

function buildEmailText(otp: string, requestedEmail: string) {
  return `Dakshinkali Admin setup approval code: ${otp}

Requested account: ${requestedEmail}

This code expires in 5 minutes. Share it only if you approve this admin/staff setup request.`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildEmailHtml(otp: string, requestedEmail: string) {
  const safeOtp = escapeHtml(otp);
  const safeRequestedEmail = escapeHtml(requestedEmail);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dakshinkali Admin setup approval code</title>
  </head>
  <body style="margin:0; padding:0; background:#f3f6fb; font-family:Arial, Helvetica, sans-serif; color:#172033;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border:1px solid #e6edf5; border-radius:16px; overflow:hidden; box-shadow:0 18px 45px rgba(23,32,51,0.08);">
            <tr>
              <td style="background:#0f6b8f; padding:28px 32px; text-align:left;">
                <p style="margin:0; color:#c9f2ff; font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Dakshinkali Admin</p>
                <h1 style="margin:10px 0 0; color:#ffffff; font-size:24px; line-height:1.25; font-weight:700;">Setup approval code</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 20px; color:#405069; font-size:15px; line-height:1.6;">
                  A staff/admin setup request is waiting for approval. Use this code only if you recognize and approve the account below.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px; border:1px solid #dce7f3; border-radius:12px; background:#f8fbff;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0 0 6px; color:#6b7b92; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Requested account</p>
                      <p style="margin:0; color:#172033; font-size:16px; line-height:1.5; font-weight:700;">${safeRequestedEmail}</p>
                    </td>
                  </tr>
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td align="center" style="padding:22px 16px; background:#ecf9fd; border:1px solid #b9e8f5; border-radius:14px;">
                      <p style="margin:0 0 10px; color:#0f6b8f; font-size:12px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase;">Approval code</p>
                      <p style="margin:0; color:#0b4259; font-size:36px; line-height:1; font-weight:800; letter-spacing:0.18em;">${safeOtp}</p>
                    </td>
                  </tr>
                </table>

                <p style="margin:0; padding:14px 16px; border-radius:12px; background:#fff7e6; color:#76511b; font-size:14px; line-height:1.5;">
                  This code expires in <strong>5 minutes</strong>. Do not share it unless you approve this setup request.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px; background:#f8fafc; border-top:1px solid #e6edf5;">
                <p style="margin:0; color:#7a8798; font-size:12px; line-height:1.5;">
                  Dakshinkali Electronics Centre security notification
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

function buildPasswordResetText(resetUrl: string) {
  return `Dakshinkali Admin password reset

Create a new password using this secure link:
${resetUrl}

This link expires in ${PASSWORD_RESET_TTL_MINUTES} minutes. If you did not request this, you can ignore this email.`;
}

function buildPasswordResetHtml(resetUrl: string) {
  const safeResetUrl = escapeHtml(resetUrl);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dakshinkali Admin password reset</title>
  </head>
  <body style="margin:0; padding:0; background:#f3f6fb; font-family:Arial, Helvetica, sans-serif; color:#172033;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f6fb; margin:0; padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background:#ffffff; border:1px solid #e6edf5; border-radius:16px; overflow:hidden; box-shadow:0 18px 45px rgba(23,32,51,0.08);">
            <tr>
              <td style="background:#0f6b8f; padding:28px 32px; text-align:left;">
                <p style="margin:0; color:#c9f2ff; font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase;">Dakshinkali Admin</p>
                <h1 style="margin:10px 0 0; color:#ffffff; font-size:24px; line-height:1.25; font-weight:700;">Create a new password</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 22px; color:#405069; font-size:15px; line-height:1.6;">
                  We received a request to reset your admin password. Use the secure button below to create a new password.
                </p>

                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                  <tr>
                    <td>
                      <a href="${safeResetUrl}" style="display:inline-block; background:#0f6b8f; color:#ffffff; text-decoration:none; border-radius:10px; padding:14px 20px; font-size:15px; font-weight:700;">
                        Create New Password
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 18px; color:#64748b; font-size:13px; line-height:1.6;">
                  This link expires in <strong>${PASSWORD_RESET_TTL_MINUTES} minutes</strong>. If the button does not work, copy and paste this link into your browser:
                </p>
                <p style="margin:0; padding:14px 16px; border-radius:12px; background:#f8fbff; border:1px solid #dce7f3; color:#0f6b8f; font-size:13px; line-height:1.5; word-break:break-all;">
                  ${safeResetUrl}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px; background:#f8fafc; border-top:1px solid #e6edf5;">
                <p style="margin:0; color:#7a8798; font-size:12px; line-height:1.5;">
                  Ignore this email if you did not request a Dakshinkali Admin password reset.
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

export async function sendAdminSetupOtpEmail({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) {
  const provider = (process.env.ADMIN_EMAIL_PROVIDER || "resend").toLowerCase();
  const isProduction = process.env.NODE_ENV === "production";
  const requestedEmail = normalizeEmail(email);
  const deliveryEmail = getAdminOtpRecipient();

  if (provider !== "mock") {
    await sendWithResend({
      deliveryEmail,
      subject: "Dakshinkali Admin setup approval code",
      text: buildEmailText(otp, requestedEmail),
      html: buildEmailHtml(otp, requestedEmail),
    });
    return;
  }

  if (
    provider === "mock" &&
    (!isProduction || process.env.ALLOW_MOCK_EMAIL_IN_PRODUCTION === "true")
  ) {
    console.log("[ADMIN_SETUP_EMAIL_OTP_MOCK]", {
      requestedEmail,
      deliveryEmail,
      otp,
    });
    return;
  }

  throw new Error("Admin email provider is not configured for production.");
}

export async function sendAdminPasswordResetEmail({
  email,
  resetUrl,
}: {
  email: string;
  resetUrl: string;
}) {
  const provider = (process.env.ADMIN_EMAIL_PROVIDER || "resend").toLowerCase();
  const isProduction = process.env.NODE_ENV === "production";
  const deliveryEmail = normalizeEmail(email);
  const subject = "Create a new Dakshinkali Admin password";
  const text = buildPasswordResetText(resetUrl);
  const html = buildPasswordResetHtml(resetUrl);

  if (provider !== "mock") {
    await sendWithResend({ deliveryEmail, subject, text, html });
    return;
  }

  if (
    provider === "mock" &&
    (!isProduction || process.env.ALLOW_MOCK_EMAIL_IN_PRODUCTION === "true")
  ) {
    console.log("[ADMIN_PASSWORD_RESET_EMAIL_MOCK]", {
      deliveryEmail,
      resetUrl,
    });
    return;
  }

  throw new Error("Admin email provider is not configured for production.");
}

export async function createAdminEmailOtpChallenge(input: CreateAdminEmailOtpInput) {
  const email = normalizeEmail(input.email);
  const otp = generateOtp();
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    throw new Error("Admin service role is not configured.");
  }

  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000).toISOString();

  const { error } = await supabase.from("admin_email_otp_challenges").insert({
    email,
    purpose: input.purpose,
    otp_hash: hashOtp(email, otp, input.purpose),
    expires_at: expiresAt,
    max_attempts: OTP_MAX_ATTEMPTS,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
  });

  if (error) {
    throw error;
  }

  await sendAdminSetupOtpEmail({ email, otp });
}

export async function createAdminPasswordResetChallenge(input: {
  email: string;
  resetUrlBase: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const token = generateResetToken();
  const supabase = tryCreateServiceClient();
  if (!supabase) {
    throw new Error("Admin service role is not configured.");
  }

  const expiresAt = new Date(
    Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000,
  ).toISOString();
  const resetUrl = `${input.resetUrlBase}?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  const { error } = await supabase.from("admin_email_otp_challenges").insert({
    email,
    purpose: "password_reset",
    otp_hash: hashToken(email, token, "password_reset"),
    expires_at: expiresAt,
    max_attempts: 1,
    ip_address: input.ipAddress ?? null,
    user_agent: input.userAgent ?? null,
  });

  if (error) {
    throw error;
  }

  await sendAdminPasswordResetEmail({ email, resetUrl });
}

export async function verifyAdminEmailOtpChallenge(input: VerifyAdminEmailOtpInput) {
  const email = normalizeEmail(input.email);
  const otp = input.otp.trim();

  if (!/^\d{6}$/.test(otp)) {
    return false;
  }

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return false;
  }

  const { data: challenge, error } = await supabase
    .from("admin_email_otp_challenges")
    .select("id, otp_hash, attempts, max_attempts, expires_at, consumed_at")
    .eq("email", email)
    .eq("purpose", input.purpose)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !challenge) {
    return false;
  }

  const attempts = Number(challenge.attempts ?? 0);
  const maxAttempts = Number(challenge.max_attempts ?? OTP_MAX_ATTEMPTS);
  if (
    challenge.consumed_at ||
    attempts >= maxAttempts ||
    new Date(challenge.expires_at).getTime() < Date.now()
  ) {
    return false;
  }

  const expectedHash = hashOtp(email, otp, input.purpose);
  const expectedBuffer = Buffer.from(expectedHash, "hex");
  const actualBuffer = Buffer.from(String(challenge.otp_hash), "hex");
  const matches =
    expectedBuffer.length === actualBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, actualBuffer);

  if (!matches) {
    await supabase
      .from("admin_email_otp_challenges")
      .update({ attempts: attempts + 1 })
      .eq("id", challenge.id);
    return false;
  }

  await supabase
    .from("admin_email_otp_challenges")
    .update(
      input.consume === false
        ? { attempts: attempts + 1 }
        : {
            consumed_at: new Date().toISOString(),
            attempts: attempts + 1,
          },
    )
    .eq("id", challenge.id);

  return true;
}

export async function consumeAdminPasswordResetChallenge(input: {
  email: string;
  token: string;
}) {
  const email = normalizeEmail(input.email);
  const token = input.token.trim();

  if (!token) {
    return false;
  }

  const supabase = tryCreateServiceClient();
  if (!supabase) {
    return false;
  }

  const { data: challenge, error } = await supabase
    .from("admin_email_otp_challenges")
    .select("id, otp_hash, attempts, max_attempts, expires_at, consumed_at")
    .eq("email", email)
    .eq("purpose", "password_reset")
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !challenge) {
    return false;
  }

  const attempts = Number(challenge.attempts ?? 0);
  const maxAttempts = Number(challenge.max_attempts ?? 1);
  if (
    challenge.consumed_at ||
    attempts >= maxAttempts ||
    new Date(challenge.expires_at).getTime() < Date.now()
  ) {
    return false;
  }

  const expectedHash = hashToken(email, token, "password_reset");
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
