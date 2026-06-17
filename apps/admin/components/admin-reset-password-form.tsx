"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { resetAdminPassword } from "@/lib/admin/login-security";

export function AdminResetPasswordForm({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasResetLink = Boolean(email && token);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await resetAdminPassword(new FormData(event.currentTarget));
    setSubmitting(false);

    if (result.status === "error") {
      setMessage(result.message);
      return;
    }

    toast.success(result.message);
    router.replace(result.redirectTo ?? "/login");
    router.refresh();
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#080a0f] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(53,154,207,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(53,154,207,0.10)_1px,transparent_1px)] bg-[size:44px_44px] opacity-25" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(53,154,207,0.24),transparent_62%)]" />

      <section className="relative mx-auto grid min-h-dvh w-full max-w-xl place-items-center px-4 py-6 sm:px-5 sm:py-10">
        <div className="w-full rounded-lg border border-white/10 bg-[#10131a]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur sm:p-9">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-accent">Dakshinkali Admin</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                Create New Password
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                Choose a new password for your admin account.
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-accent">
              <KeyRound className="size-5" />
            </div>
          </div>

          {!hasResetLink ? (
            <div className="grid gap-4">
              <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                Password reset link is invalid or expired.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex h-12 items-center justify-center rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Request a New Link
              </Link>
            </div>
          ) : (
            <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-5">
              <input type="hidden" name="email" value={email} />
              <input type="hidden" name="token" value={token} />

              <label className="grid gap-2">
                <span className="text-sm text-slate-300">Create New Password</span>
                <span className="relative block">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-14 w-full rounded-lg border border-white/10 bg-black/30 px-4 pr-12 text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
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
                  className="h-14 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                />
              </label>

              {message ? (
                <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                  {message}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
                Submit
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
