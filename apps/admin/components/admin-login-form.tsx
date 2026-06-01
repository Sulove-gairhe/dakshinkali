"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@dakshinkali/auth";

function sanitizeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  return next;
}

export function AdminLoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = useMemo(
    () => sanitizeNextPath(searchParams.get("redirectTo")),
    [searchParams],
  );
  const { signIn, loading, user, role, configError } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(initialError ?? null);

  useEffect(() => {
    if (!loading && user) {
      if (role === "admin" || role === "staff") {
        router.replace("/admin");
        return;
      }
      setMessage(
        "This account does not have admin access. Use an admin or staff seed account.",
      );
    }
  }, [loading, user, role, router, redirectTo]);

  if (loading) {
    return <p style={{ padding: 24 }}>Loading...</p>;
  }

  if (configError) {
    return (
      <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
        <h1>Admin sign in</h1>
        <p>{configError}</p>
        <p style={{ color: "#667085", fontSize: 14 }}>
          Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.
        </p>
      </main>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const { error } = await signIn(email, password);

    if (error) {
      setMessage(error.message);
      setSubmitting(false);
      return;
    }

    // Role-based redirect is handled by the useEffect above
  }

  return (
    <main style={{ padding: 24, maxWidth: 480, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 8 }}>Dakshinkali Admin</h1>
      <p style={{ color: "#667085", marginBottom: 20 }}>
        Sign in with a seeded admin account (e.g. admin1@dakshinkali.shop).
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} style={{ display: "grid", gap: 12 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{ padding: 10, border: "1px solid #c8d0d9", borderRadius: 6 }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Password</span>
          <input
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{ padding: 10, border: "1px solid #c8d0d9", borderRadius: 6 }}
          />
        </label>

        {message ? (
          <p style={{ color: "#b42318", margin: 0, fontSize: 14 }}>{message}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "10px 12px",
            borderRadius: 6,
            border: "1px solid #1f4f46",
            background: "#1f6f5f",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p style={{ marginTop: 16, fontSize: 14, color: "#667085" }}>
        Storefront:{" "}
        <Link href={process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3000"}>
          Back to shop
        </Link>
      </p>
    </main>
  );
}
