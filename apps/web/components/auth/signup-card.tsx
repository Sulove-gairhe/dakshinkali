"use client";

import { AuthForm } from "@/components/auth/auth-form";

type SignupCardProps = {
  initialError?: string;
};

export function SignupCard({ initialError }: SignupCardProps) {
  return <AuthForm mode="signup" initialError={initialError} />;
}
