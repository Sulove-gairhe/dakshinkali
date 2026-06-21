"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { sanitizeNextPath } from "@/lib/utils/routes";

export function LoginForm({
  initialError,
  initialRedirectTo,
}: {
  initialError?: string;
  initialRedirectTo?: string;
}) {
  const router = useRouter();
  const redirectTo = useMemo(
    () => sanitizeNextPath(initialRedirectTo),
    [initialRedirectTo],
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(initialError ?? null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        setMessage("Credentials don't match");
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to sign in right now.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-[#080a0f] px-4 py-8 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-[#10131a] p-6 shadow-2xl shadow-black/40 sm:p-8">
        <div className="mb-7 flex items-start gap-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg border border-sky-300/20 bg-sky-300/10 text-sky-200">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-sky-200">Dakshinkali</p>
            <h1 className="mt-1 text-2xl font-semibold">HisabKitab</h1>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              Private business operations access.
            </p>
          </div>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="grid gap-5">
          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-12 rounded-lg border border-white/10 bg-black/30 px-3 text-white outline-none transition focus:border-sky-300/60 focus:ring-2 focus:ring-sky-300/15"
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm text-slate-300">Password</span>
            <span className="relative block">
              <input
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 w-full rounded-lg border border-white/10 bg-black/30 px-3 pr-11 text-white outline-none transition focus:border-sky-300/60 focus:ring-2 focus:ring-sky-300/15"
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 hover:bg-white/10 hover:text-white"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </span>
          </label>

          {message ? (
            <p className="rounded-lg border border-red-300/20 bg-red-400/10 px-3 py-2 text-sm text-red-100">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#359ACF] px-4 text-sm font-semibold text-white transition hover:bg-[#2d8abb] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
            Continue
          </button>
        </form>
      </section>
    </main>
  );
}
