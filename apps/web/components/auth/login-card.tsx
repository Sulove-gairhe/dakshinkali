"use client";

import { AuthForm } from "@/components/auth/auth-form";

type LoginCardProps = {
  initialError?: string;
};

export function LoginCard({ initialError }: LoginCardProps) {
  return <AuthForm mode="login" initialError={initialError} />;
}
