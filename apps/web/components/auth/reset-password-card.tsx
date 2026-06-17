"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock } from "lucide-react";
import { AuthBrandTitle } from "@/components/auth/auth-brand-title";
import { cn } from "@/lib/utils";
import { eyeClickMotion, loginCardMotion } from "@/lib/animations";
import { resetCustomerPassword } from "@/lib/customer-password-reset";

const MIN_PASSWORD_LENGTH = 6;
const pointer = "cursor-pointer";

export function ResetPasswordCard({
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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");
  const hasResetLink = Boolean(email && token);

  function setErrorMessage(text: string) {
    setMessageTone("error");
    setMessage(text);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const result = await resetCustomerPassword(new FormData(event.currentTarget));
    setSubmitting(false);

    if (result.status === "error") {
      setErrorMessage(result.message);
      return;
    }

    setMessageTone("success");
    setMessage(result.message);
    router.replace(result.redirectTo ?? "/login");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <motion.div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg sm:p-10"
        {...loginCardMotion}
      >
        <div className="text-center">
          <AuthBrandTitle />
          <h1 className="mt-6 text-2xl font-bold text-foreground">
            Create New Password
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Choose a new password for your Dakshinkali storefront account.
          </p>
        </div>

        {!hasResetLink ? (
          <div className="mt-8 space-y-4">
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm text-destructive">
              Password reset link is invalid or expired.
            </p>
            <Link
              href="/login"
              className={cn(
                "flex h-12 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90",
                pointer,
              )}
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-5">
            <input type="hidden" name="email" value={email} />
            <input type="hidden" name="token" value={token} />

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-muted-foreground"
              >
                Create New Password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  className="h-11 w-full rounded-lg border border-border bg-background pr-10 pl-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <motion.button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className={cn(
                    "absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground",
                    pointer,
                  )}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  {...eyeClickMotion}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </motion.button>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-muted-foreground"
              >
                Confirm password
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  className="h-11 w-full rounded-lg border border-border bg-background pr-10 pl-10 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <motion.button
                  type="button"
                  onClick={() => setShowConfirmPassword((current) => !current)}
                  className={cn(
                    "absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground",
                    pointer,
                  )}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                  {...eyeClickMotion}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="size-4" aria-hidden="true" />
                  ) : (
                    <Eye className="size-4" aria-hidden="true" />
                  )}
                </motion.button>
              </div>
            </div>

            {message ? (
              <p
                className={cn(
                  "rounded-lg px-3 py-2 text-center text-sm",
                  messageTone === "success"
                    ? "bg-primary/10 text-foreground"
                    : "bg-destructive/10 text-destructive",
                )}
                role="alert"
              >
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "h-12 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60",
                pointer,
              )}
            >
              {submitting ? "Please wait..." : "Submit"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center">
          <Link
            href="/login"
            className={cn(
              "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              pointer,
            )}
          >
            Back to sign in
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
