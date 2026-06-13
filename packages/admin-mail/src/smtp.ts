// TODO: Switch SMTP_USER to dakshinkalielectronics@gmail.com once
// Google Workspace SMTP access is confirmed and App Password works.
// Current sender: sulovegairhe510@gmail.com (display name overridden via SMTP_FROM)
// To fix dakshinkalielectronics: ensure 2FA is on, IMAP is enabled,
// delete all existing App Passwords and regenerate fresh one.
import crypto from "crypto";
import net from "net";
import tls from "tls";

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

export async function sendSmtpMail(input: SmtpMailInput) {
  console.log("[SMTP_ATTEMPT]", {
    host: input.host,
    port: input.port,
    user: input.username,
    to: input.to,
  });

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

  const sendCommand = async (
    command: string,
    expected: number[],
    commandLabel = command,
  ) => {
    socket.write(`${command}\r\n`);
    const response = await waitForResponse();
    const code = Number(response.slice(0, 3));
    if (!expected.includes(code)) {
      throw new Error(`SMTP command failed: ${commandLabel} -> ${response.trim()}`);
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
    await sendCommand(Buffer.from(input.username).toString("base64"), [334], "[AUTH_USERNAME]");
    await sendCommand(Buffer.from(input.password).toString("base64"), [235], "[AUTH_PASSWORD]");
    await sendCommand(`MAIL FROM:<${extractEmailAddress(input.from)}>`, [250]);
    await sendCommand(`RCPT TO:<${extractEmailAddress(input.to)}>`, [250, 251]);
    await sendCommand("DATA", [354]);
    await sendCommand(`${createSmtpMessage(input)}\r\n.`, [250]);
    await sendCommand("QUIT", [221]);
    console.log("[SMTP_SUCCESS]");
  } catch (error) {
    console.log("[SMTP_ERROR]", error instanceof Error ? error.message : String(error));
    throw error;
  } finally {
    socket.end();
  }
}

export function getSmtpConfigFromEnv() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const username = process.env.SMTP_USER;
  const password = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || process.env.ADMIN_EMAIL_FROM;

  if (!host || !username || !password || !from) {
    return null;
  }

  return { host, port, username, password, from };
}
