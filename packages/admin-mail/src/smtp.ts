import { Resend } from "resend";

export type SmtpMailInput = {
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

const RESEND_FROM =
  process.env.RESEND_FROM ??
  "Dakshinkali Electronics Centre <noreply@dakshinkali.shop>";

export async function sendSmtpMail(input: SmtpMailInput) {
  console.log("[SMTP_ATTEMPT]", {
    provider: "resend",
    from: RESEND_FROM,
    to: input.to,
  });

  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is required.");
    }

    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: RESEND_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log("[SMTP_SUCCESS]");
  } catch (error) {
    console.log("[SMTP_ERROR]", error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export function getSmtpConfigFromEnv() {
  const host = process.env.SMTP_HOST || "resend";
  const port = Number(process.env.SMTP_PORT || 587);
  const username = process.env.SMTP_USER || "resend";
  const password = process.env.SMTP_PASS || process.env.RESEND_API_KEY;
  const from = process.env.SMTP_FROM || RESEND_FROM;

  if (!password) {
    return null;
  }

  return { host, port, username, password, from };
}
