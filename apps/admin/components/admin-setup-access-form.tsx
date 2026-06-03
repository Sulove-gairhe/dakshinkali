"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  Loader2,
  MailCheck,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  beginAdminSetupAccess,
  verifyAdminSetupAccessOtp,
} from "@/lib/admin/login-security";

type SetupStep = "credentials" | "otp";

export function AdminSetupAccessForm() {
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>("credentials");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await beginAdminSetupAccess(new FormData(event.currentTarget));
    setSubmitting(false);

    if (result.status === "error") {
      setMessage(result.message);
      return;
    }

    if (result.status === "success") {
      toast.success(result.message);
      router.replace(result.redirectTo ?? "/admin");
      router.refresh();
      return;
    }

    setMessage(result.message);
    setOtp("");
    setStep("otp");
  }

  async function handleOtpSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    formData.set("email", email);
    formData.set("username", username);
    formData.set("password", password);
    formData.set("confirmPassword", confirmPassword);

    const result = await verifyAdminSetupAccessOtp(formData);
    setSubmitting(false);

    if (result.status === "error") {
      setMessage(result.message);
      return;
    }

    if (result.status !== "success") {
      setMessage(result.message);
      return;
    }

    toast.success(result.message);
    router.replace(result.redirectTo ?? "/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#080a0f] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-25" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.22),transparent_62%)]" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-2xl place-items-center px-5 py-10">
        <div className="w-full rounded-lg border border-white/10 bg-[#10131a]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur sm:p-9">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-emerald-300">
                Dakshinkali Admin
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                Setup admin or staff access
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                Added emails continue immediately. New requests need a private
                approval code from the administrator.
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-lg border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
              {step === "otp" ? (
                <MailCheck className="size-5" />
              ) : (
                <UserPlus className="size-5" />
              )}
            </div>
          </div>

          {step === "credentials" ? (
            <form
              onSubmit={(event) => void handleCredentialsSubmit(event)}
              className="grid gap-5"
            >
              <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-5">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-lg bg-emerald-300/15 text-emerald-200">
                    <ShieldCheck className="size-5" />
                  </span>
                  <div>
                    <h2 className="font-semibold text-emerald-50">New staff setup</h2>
                    <p className="mt-1 text-sm leading-6 text-slate-300">
                      Create the account details. If the email is not already
                      added, an approval code is sent to the administrator.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm text-slate-300">Email</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-slate-300">Username</span>
                  <input
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    pattern="[a-zA-Z0-9_-]{3,32}"
                    value={username}
                    onChange={(event) => setUsername(event.target.value.toLowerCase())}
                    className="h-12 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm text-slate-300">Password</span>
                  <span className="relative block">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-4 pr-12 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                    />
                    <button
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm text-slate-300">Confirm password</span>
                  <input
                    name="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="h-12 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-emerald-300/60 focus:ring-2 focus:ring-emerald-300/20"
                  />
                </label>
              </div>

              {message ? <Message text={message} tone="error" /> : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-emerald-300 px-4 font-semibold text-black transition hover:bg-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Continue Setup
                </button>
                <Link
                  href="/login"
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Back to sign in
                </Link>
              </div>
            </form>
          ) : (
            <form onSubmit={(event) => void handleOtpSubmit(event)} className="grid gap-5">
              <div className="rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-5">
                <h2 className="font-semibold text-yellow-50">Verify approval code</h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  An approval code was sent to the administrator. Enter the
                  6-digit code to continue.
                </p>
              </div>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Verification code</span>
                <input
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  minLength={6}
                  maxLength={6}
                  pattern="[0-9]{6}"
                  value={otp}
                  onChange={(event) =>
                    setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  className="h-14 rounded-lg border border-white/10 bg-black/30 px-4 text-center text-xl font-semibold tracking-[0.35em] text-white outline-none transition focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/20"
                />
              </label>

              {message ? <Message text={message} tone="info" /> : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 font-semibold text-black transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                  Verify Code
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setMessage(null);
                    setOtp("");
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

function Message({
  text,
  tone,
}: {
  text: string;
  tone: "error" | "info";
}) {
  return (
    <p
      className={
        tone === "error"
          ? "rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200"
          : "rounded-lg border border-yellow-300/20 bg-yellow-300/10 px-3 py-2 text-sm text-yellow-50"
      }
    >
      {text}
    </p>
  );
}
