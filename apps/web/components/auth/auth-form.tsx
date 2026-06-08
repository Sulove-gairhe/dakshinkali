"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { useAuth } from "@dakshinkali/auth";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  getAuthCallbackUrl,
  getEmailRedirectUrl,
  sanitizeNextPath,
} from "@/lib/auth-urls";
import {
  eyeClickMotion,
  loginCardMotion,
  staggerSectionMotion,
} from "@/lib/animations";
import { AuthBrandTitle } from "@/components/auth/auth-brand-title";

const MIN_PASSWORD_LENGTH = 6;
const pointer = "cursor-pointer";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

type AuthFormProps = {
  mode: "login" | "signup";
  initialError?: string;
};

export function AuthForm({ mode, initialError }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => sanitizeNextPath(searchParams.get("redirectTo")),
    [searchParams],
  );
  const {
    signIn,
    signUp,
    signInWithGoogle,
    loading,
    user,
    role,
    supabase,
    configError,
  } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(initialError ?? null);
  const [messageTone, setMessageTone] = useState<"error" | "success">(
    initialError ? "error" : "success",
  );

  const isLogin = mode === "login";

  useEffect(() => {
    if (!loading && user) {
      if (role === "admin" || role === "staff") {
        const adminUrl =
          process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001";
        window.location.href = `${adminUrl}/admin`;
        return;
      }
      router.replace(redirectTo);
    }
  }, [loading, user, role, router, redirectTo]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Just a moment...
      </div>
    );
  }

  if (user) {
    return null;
  }

  if (configError || !supabase) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg sm:p-10">
          <AuthBrandTitle />
          <p className="mt-6 text-sm leading-6 text-muted-foreground">
            {configError ??
              "Sign in is temporarily unavailable. Please try again shortly."}
          </p>
          <p className="mt-3 text-xs leading-5 text-muted-foreground/80">
            Our team is working to restore this service. Please check back soon.
          </p>
          <Link
            href="/"
            className={cn(
              "mt-6 inline-block text-sm font-semibold text-primary transition-colors hover:text-primary/80",
              pointer,
            )}
          >
            Back to store
          </Link>
        </div>
      </main>
    );
  }

  function setSuccessMessage(text: string) {
    setMessageTone("success");
    setMessage(text);
  }

  function setErrorMessage(text: string) {
    setMessageTone("error");
    setMessage(text);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    if (!isLogin) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setErrorMessage(
          `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
        );
        setSubmitting(false);
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match.");
        setSubmitting(false);
        return;
      }

      const { error, session, needsEmailConfirmation } = await signUp(
        email,
        password,
        fullName.trim() ? { full_name: fullName.trim() } : undefined,
        { emailRedirectTo: getEmailRedirectUrl(redirectTo) },
      );

      if (error) {
        setErrorMessage(error.message);
        setSubmitting(false);
        return;
      }

      if (session) {
        router.replace(redirectTo);
        return;
      }

      if (needsEmailConfirmation) {
        setSuccessMessage(
          "Account created. Check your email and confirm your address to finish signing up.",
        );
        setSubmitting(false);
        return;
      }

      setSuccessMessage("Account created. You can sign in now.");
      setSubmitting(false);
      return;
    }

    const { error } = await signIn(email, password);

    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
      return;
    }

    // Role-based redirect is handled by the useEffect above
  }

  async function handleGoogleSignIn() {
    setSubmitting(true);
    setMessage(null);

    const { error } = await signInWithGoogle({
      redirectPath: redirectTo,
      emailRedirectTo: getAuthCallbackUrl(redirectTo),
    });

    if (error) {
      setErrorMessage(error.message);
      setSubmitting(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setErrorMessage("Enter your email address first, then try again.");
      return;
    }

    setSubmitting(true);
    setMessage(null);

    if (!supabase) {
      setErrorMessage("Sign in is not available right now.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAuthCallbackUrl("/login"),
    });

    setSubmitting(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setSuccessMessage("Password reset link sent. Check your email inbox.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 text-foreground">
      <motion.div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-lg sm:p-10"
        {...loginCardMotion}
      >
        <motion.div className="text-center" {...staggerSectionMotion(0)}>
          <AuthBrandTitle />
        </motion.div>

        <motion.form
          className="mt-8 space-y-5"
          onSubmit={(event) => void handleSubmit(event)}
          {...staggerSectionMotion(0.08)}
        >
          {!isLogin ? (
            <div className="space-y-2">
              <label
                htmlFor="fullName"
                className="text-sm font-medium text-muted-foreground"
              >
                Full name
              </label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <input
                  id="fullName"
                  type="text"
                  autoComplete="name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Your name"
                  className="h-11 w-full rounded-lg border border-border bg-background pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-muted-foreground"
            >
              Email address
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="h-11 w-full rounded-lg border border-border bg-background pr-3 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label
                htmlFor="password"
                className="text-sm font-medium text-muted-foreground"
              >
                Password
              </label>
              {isLogin ? (
                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  className={cn(
                    "text-sm font-semibold text-primary transition-colors hover:text-primary/80",
                    pointer,
                  )}
                >
                  Forgot password?
                </button>
              ) : null}
            </div>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete={isLogin ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={
                  isLogin ? "Enter your password" : "Create a password"
                }
                required
                minLength={isLogin ? undefined : MIN_PASSWORD_LENGTH}
                className="h-11 w-full rounded-lg border border-border bg-background pr-10 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
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

          {!isLogin ? (
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
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Re-enter your password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  className="h-11 w-full rounded-lg border border-border bg-background pr-10 pl-10 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <motion.button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword((current) => !current)
                  }
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
          ) : null}

          {isLogin ? (
            <label
              className={cn("flex items-center gap-2.5", pointer)}
            >
              <Checkbox
                checked={rememberMe}
                onCheckedChange={(checked) =>
                  setRememberMe(checked === true)
                }
                aria-label="Remember me"
              />
              <span className="text-sm text-muted-foreground">Remember me</span>
            </label>
          ) : null}

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
            {submitting
              ? "Please wait..."
              : isLogin
                ? "Sign In"
                : "Create Account"}
          </button>
        </motion.form>

        <motion.div className="mt-6" {...staggerSectionMotion(0.16)}>
          <div className="relative flex items-center py-2">
            <div className="grow border-t border-border" />
            <span className="mx-4 shrink-0 text-sm text-muted-foreground">
              or continue with
            </span>
            <div className="grow border-t border-border" />
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleGoogleSignIn()}
            className={cn(
              "mt-4 flex h-12 w-full items-center justify-center gap-3 rounded-full border border-border bg-background text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-60",
              pointer,
            )}
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </motion.div>

        <motion.p
          className="mt-8 text-center text-sm text-muted-foreground"
          {...staggerSectionMotion(0.22)}
        >
          {isLogin ? (
            <>
              Don&apos;t have an account?{" "}
              <Link
                href={
                  redirectTo === "/account"
                    ? "/signup"
                    : `/signup?redirectTo=${encodeURIComponent(redirectTo)}`
                }
                className={cn(
                  "font-semibold text-primary transition-colors hover:text-primary/80",
                  pointer,
                )}
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <Link
                href={
                  redirectTo === "/account"
                    ? "/login"
                    : `/login?redirectTo=${encodeURIComponent(redirectTo)}`
                }
                className={cn(
                  "font-semibold text-primary transition-colors hover:text-primary/80",
                  pointer,
                )}
              >
                Sign in
              </Link>
            </>
          )}
        </motion.p>

        <p className="mt-6 text-center">
          <Link
            href="/"
            className={cn(
              "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
              pointer,
            )}
          >
            Back to store
          </Link>
        </p>
      </motion.div>
    </main>
  );
}
