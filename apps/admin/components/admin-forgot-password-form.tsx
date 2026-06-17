"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { requestAdminPasswordReset } from "@/lib/admin/login-security";

export function AdminForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    const result = await requestAdminPasswordReset(
      new FormData(event.currentTarget),
    );
    setSubmitting(false);

    if (result.status === "error") {
      setError(result.message);
      toast.error(result.message);
      return;
    }

    setMessage(result.message);
    toast.success(result.message);
  }

  return (
    <main className="min-h-dvh overflow-x-hidden bg-[#080a0f] text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(53,154,207,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(53,154,207,0.10)_1px,transparent_1px)] bg-[size:44px_44px] opacity-25" />
      <div className="absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_50%_0%,rgba(53,154,207,0.24),transparent_62%)]" />

      <section className="relative mx-auto grid min-h-dvh w-full max-w-xl place-items-center px-4 py-6 sm:px-5 sm:py-10">
        <div className="w-full rounded-lg border border-white/10 bg-[#10131a]/95 p-5 shadow-2xl shadow-black/50 backdrop-blur sm:p-9">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-accent">
                Dakshinkali Admin
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-normal">
                Forgot password
              </h1>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                Enter your email and we will send a secure link to create a new
                password.
              </p>
            </div>
            <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/10 text-accent">
              <Mail className="size-5" />
            </div>
          </div>

          <form
            onSubmit={(event) => void handleSubmit(event)}
            className="grid gap-5"
          >
            <label className="grid gap-2">
              <span className="text-sm text-slate-300">Email</span>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-14 rounded-lg border border-white/10 bg-black/30 px-4 text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </label>

            {error ? (
              <p className="rounded-lg border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm text-emerald-50">
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
              Send Reset Link
            </button>
          </form>

          <Link
            href="/login"
            className="mt-5 inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="size-4" />
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
