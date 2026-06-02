"use client";

import { FormEvent, type ReactNode, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Eye, EyeOff, KeyRound, Loader2, Lock, ShieldCheck, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  adminPasswordSignIn,
  requestAdminAccess,
} from "@/lib/admin/login-security";
import { getWebUrl, sanitizeNextPath } from "@/lib/auth-urls";
import { cn } from "@/lib/cn";

type LoginStep = "credentials" | "access_denied";

export function AdminLoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => sanitizeNextPath(searchParams.get("redirectTo")) || "/admin",
    [searchParams],
  );
  const [step, setStep] = useState<LoginStep>("credentials");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(initialError ?? null);
  const [deniedEmail, setDeniedEmail] = useState("");
  const [deniedUserId, setDeniedUserId] = useState<string | null>(null);
  const webUrl = getWebUrl();

  async function handleCredentialsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await adminPasswordSignIn(new FormData(event.currentTarget));

    if (result.status === "error") {
      setMessage(result.message);
      setSubmitting(false);
      return;
    }

    if (result.status === "access_denied") {
      setDeniedEmail(result.email);
      setDeniedUserId(result.userId);
      setPassword("");
      setStep("access_denied");
      setSubmitting(false);
      return;
    }

    router.replace(redirectTo === "/" ? result.redirectTo : redirectTo);
    router.refresh();
  }

  async function handleRequestAccess() {
    const formData = new FormData();
    formData.set("email", deniedEmail);
    if (deniedUserId) {
      formData.set("userId", deniedUserId);
    }

    const result = await requestAdminAccess(formData);
    toast[result.status === "success" ? "success" : "error"](result.message);
  }

  return (
    <main className="min-h-screen bg-[#080a0f] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(250,204,21,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(250,204,21,0.08)_1px,transparent_1px)] bg-[size:44px_44px] opacity-25" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(234,179,8,0.22),transparent_62%)]" />

      <section className="relative mx-auto grid min-h-screen w-full max-w-2xl place-items-center px-5 py-10">
        <div className="w-full rounded-lg border border-white/10 bg-[#10131a]/95 p-6 shadow-2xl shadow-black/50 backdrop-blur sm:p-9">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-yellow-300">
                Dakshinkali Admin
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-normal">
                {step === "credentials" ? "Sign in to admin" : "Access not granted"}
              </h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                Secure access for authorized staff only.
              </p>
            </div>
            <div className="grid size-11 place-items-center rounded-lg border border-yellow-300/20 bg-yellow-300/10 text-yellow-200">
              {step === "credentials" ? (
                <Lock className="size-5" />
              ) : (
                <Bell className="size-5 transition hover:-rotate-12 hover:translate-x-0.5" />
              )}
            </div>
          </div>

          <div className="mb-7 grid grid-cols-3 gap-3">
            <IconBadge title="Password verified by Supabase" icon={<KeyRound className="size-5" />} />
            <IconBadge title="Admin or staff role required" icon={<UserCheck className="size-5" />} />
            <IconBadge title="Server-side role protection" icon={<ShieldCheck className="size-5" />} />
          </div>

          {step === "credentials" ? (
            <form
              onSubmit={(event) => void handleCredentialsSubmit(event)}
              className="grid gap-5"
            >
              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Email or username</span>
                <input
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  required
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  className="h-14 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/20"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Password</span>
                <span className="relative block">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-14 w-full rounded-lg border border-white/10 bg-black/30 px-4 pr-12 text-white outline-none transition focus:border-yellow-300/60 focus:ring-2 focus:ring-yellow-300/20"
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

              {message ? (
                <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="mt-1 inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-yellow-300 px-4 font-semibold text-black transition hover:bg-yellow-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Continue Securely
              </button>
            </form>
          ) : (
            <div className="rounded-lg border border-yellow-300/20 bg-yellow-300/10 p-5">
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => void handleRequestAccess()}
                  className="group grid size-12 shrink-0 place-items-center rounded-lg border border-yellow-300/20 bg-yellow-300/15 text-yellow-100"
                  aria-label="Request access"
                >
                  <Bell className="size-5 transition group-hover:-rotate-12 group-hover:translate-x-0.5" />
                </button>
                <div>
                  <h3 className="font-semibold text-yellow-50">Access not granted</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Your account is authenticated, but admin access has not been
                    granted yet. Request access from the store administrator.
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void handleRequestAccess()}
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-yellow-300 px-4 font-semibold text-black transition hover:bg-yellow-200"
                >
                  Request Access
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStep("credentials");
                    setMessage(null);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] px-4 text-sm text-slate-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          )}

          <p className="mt-5 text-sm text-slate-400">
            Storefront:{" "}
            <Link className="text-yellow-200 hover:text-yellow-100" href={webUrl}>
              Back to shop
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function IconBadge({
  title,
  icon,
}: {
  title: string;
  icon: ReactNode;
}) {
  return (
    <div
      title={title}
      className={cn(
        "grid h-14 place-items-center rounded-lg border border-white/10",
        "bg-white/[0.04] text-yellow-200 shadow-inner shadow-white/5",
      )}
    >
      {icon}
      <span className="sr-only">{title}</span>
    </div>
  );
}
