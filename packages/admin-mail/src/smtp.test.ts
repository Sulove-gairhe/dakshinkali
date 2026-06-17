import { afterEach, describe, expect, it } from "vitest";
import { getSmtpConfigFromEnv, smtpTestInternals } from "./smtp";

const ORIGINAL_ENV = process.env;

describe("smtp mail transport", () => {
  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it("reads raw SMTP config from SMTP env vars", () => {
    process.env = {
      ...ORIGINAL_ENV,
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587",
      SMTP_USER: "sender@example.com",
      SMTP_PASS: "app-password",
      SMTP_FROM: "Dakshinkali Admin <sender@example.com>",
      RESEND_API_KEY: "should-not-be-used",
    };

    expect(getSmtpConfigFromEnv()).toEqual({
      host: "smtp.gmail.com",
      port: 587,
      username: "sender@example.com",
      password: "app-password",
      from: "Dakshinkali Admin <sender@example.com>",
    });
  });

  it("does not treat RESEND_API_KEY as an SMTP password", () => {
    process.env = {
      ...ORIGINAL_ENV,
      SMTP_HOST: "smtp.gmail.com",
      SMTP_PORT: "587",
      SMTP_USER: "sender@example.com",
      SMTP_PASS: "",
      SMTP_FROM: "Dakshinkali Admin <sender@example.com>",
      RESEND_API_KEY: "re_invalid",
    };

    expect(getSmtpConfigFromEnv()).toBeNull();
  });

  it("creates an SMTP-safe multipart message", () => {
    const message = smtpTestInternals.createSmtpMessage({
      host: "smtp.gmail.com",
      port: 587,
      username: "sender@example.com",
      password: "app-password",
      from: "Dakshinkali Admin <sender@example.com>",
      to: "recipient@example.com",
      subject: "Setup code",
      text: "Line one\n.Starts with dot",
      html: "<p>Line one</p>\n<p>.Starts with dot</p>",
    });

    expect(message).toContain("From: Dakshinkali Admin <sender@example.com>\r\n");
    expect(message).toContain("To: recipient@example.com\r\n");
    expect(message).toContain("Subject: Setup code\r\n");
    expect(message).toContain("Content-Type: multipart/alternative;");
    expect(message).toContain("Line one\r\n..Starts with dot");
    expect(message).toContain("<p>Line one</p>\r\n<p>.Starts with dot</p>");
  });

  it("extracts addresses from display-name senders", () => {
    expect(
      smtpTestInternals.extractEmailAddress("Dakshinkali Admin <sender@example.com>"),
    ).toBe("sender@example.com");
    expect(smtpTestInternals.extractEmailAddress("plain@example.com")).toBe(
      "plain@example.com",
    );
  });
});
