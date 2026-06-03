import "server-only";

import crypto from "crypto";
import net from "net";
import tls from "tls";
import { createServiceClient } from "@/lib/supabase/service-server";

type OtpPurpose = "new_user_setup";

const OTP_TTL_MINUTES = 5;
const OTP_DIGITS = 6;
const OTP_MAX_ATTEMPTS = 5;

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

function generateOtp() {
  const min = 10 ** (OTP_DIGITS - 1);
  const max = 10 ** OTP_DIGITS;
  return String(crypto.randomInt(min, max));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getAdminOtpRecipient() {
  const recipient =
    process.env.ADMIN_EMAIL_OTP_RECIPIENT ||
    process.env.ADMIN_EMAIL_TO ||
    process.env.ADMIN_EMAIL_FROM;

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
  requestedEmail: string;
  otp: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ADMIN_EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY and ADMIN_EMAIL_FROM are required.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: input.deliveryEmail,
      subject: "Dakshinkali Admin setup approval code",
      text: buildEmailText(input.otp, input.requestedEmail),
      html: buildEmailHtml(input.otp, input.requestedEmail),
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend failed with HTTP ${response.status}`);
  }
}

async function sendWithSmtp(input: {
  deliveryEmail: string;
  requestedEmail: string;
  otp: string;
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.ADMIN_EMAIL_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error("SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM are required.");
  }

  await sendSmtpMail({
    host,
    port,
    username: user,
    password: pass,
    from,
    to: input.deliveryEmail,
    subject: "Dakshinkali Admin setup approval code",
    text: buildEmailText(input.otp, input.requestedEmail),
    html: buildEmailHtml(input.otp, input.requestedEmail),
  });
}

function buildEmailText(otp: string, requestedEmail: string) {
  return `Dakshinkali Admin setup approval code: ${otp}

Requested account: ${requestedEmail}

This code expires in 5 minutes. Share it only if you approve this admin/staff setup request.`;
}

function buildEmailHtml(otp: string, requestedEmail: string) {
  return `<p>Dakshinkali Admin setup approval code: <strong>${otp}</strong></p><p>Requested account: <strong>${requestedEmail}</strong></p><p>This code expires in 5 minutes. Share it only if you approve this admin/staff setup request.</p>`;
}

type SmtpMailInput = {
  host: string;
  port: number;
  username: string;
  password: string;
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};

function extractEmailAddress(value: string) {
  const match = value.match(/<([^>]+)>/);
  return (match?.[1] ?? value).trim();
}

function escapeSmtpData(value: string) {
  return value.replace(/\r?\n/g, "\r\n").replace(/^\./gm, "..");
}

function createSmtpMessage(input: SmtpMailInput) {
  const boundary = `dakshinkali-admin-${crypto.randomBytes(8).toString("hex")}`;
  return [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "",
    escapeSmtpData(input.text),
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "",
    escapeSmtpData(input.html),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

async function sendSmtpMail(input: SmtpMailInput) {
  const secure = input.port === 465;
  let socket: net.Socket | tls.TLSSocket = secure
    ? tls.connect(input.port, input.host, { servername: input.host })
    : net.connect(input.port, input.host);

  socket.setTimeout(15000);

  let buffer = "";
  const waitForResponse = () =>
    new Promise<string>((resolve, reject) => {
      const onData = (chunk: Buffer) => {
        buffer += chunk.toString("utf8");
        const lines = buffer.split(/\r?\n/).filter(Boolean);
        const lastLine = lines.at(-1);
        if (lastLine && /^\d{3} /.test(lastLine)) {
          const response = buffer;
          buffer = "";
          socket.off("data", onData);
          socket.off("error", onError);
          socket.off("timeout", onTimeout);
          resolve(response);
        }
      };
      const onError = (error: Error) => {
        socket.off("data", onData);
        socket.off("timeout", onTimeout);
        reject(error);
      };
      const onTimeout = () => {
        socket.off("data", onData);
        socket.off("error", onError);
        reject(new Error("SMTP connection timed out."));
      };
      socket.on("data", onData);
      socket.once("error", onError);
      socket.once("timeout", onTimeout);
    });

  const sendCommand = async (command: string, expected: number[]) => {
    socket.write(`${command}\r\n`);
    const response = await waitForResponse();
    const code = Number(response.slice(0, 3));
    if (!expected.includes(code)) {
      throw new Error(`SMTP command failed: ${command} -> ${response.trim()}`);
    }
  };

  try {
    await waitForResponse();
    await sendCommand("EHLO dakshinkali.shop", [250]);

    if (!secure) {
      await sendCommand("STARTTLS", [220]);
      socket = tls.connect({
        socket,
        servername: input.host,
      });
      buffer = "";
      await sendCommand("EHLO dakshinkali.shop", [250]);
    }

    await sendCommand("AUTH LOGIN", [334]);
    await sendCommand(Buffer.from(input.username).toString("base64"), [334]);
    await sendCommand(Buffer.from(input.password).toString("base64"), [235]);
    await sendCommand(`MAIL FROM:<${extractEmailAddress(input.from)}>`, [250]);
    await sendCommand(`RCPT TO:<${extractEmailAddress(input.to)}>`, [250, 251]);
    await sendCommand("DATA", [354]);
    await sendCommand(`${createSmtpMessage(input)}\r\n.`, [250]);
    await sendCommand("QUIT", [221]);
  } finally {
    socket.end();
  }
}

export async function sendAdminSetupOtpEmail({
  email,
  otp,
}: {
  email: string;
  otp: string;
}) {
  const provider = (process.env.ADMIN_EMAIL_PROVIDER || "mock").toLowerCase();
  const isProduction = process.env.NODE_ENV === "production";
  const requestedEmail = normalizeEmail(email);
  const deliveryEmail = getAdminOtpRecipient();

  if (provider === "resend") {
    await sendWithResend({ deliveryEmail, requestedEmail, otp });
    return;
  }

  if (provider === "smtp") {
    await sendWithSmtp({ deliveryEmail, requestedEmail, otp });
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

  throw new Error("Admin email provider is not configured.");
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
