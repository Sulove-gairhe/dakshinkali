import { Suspense } from "react";
import { LoginCard } from "@/components/auth/login-card";
import { decodeAuthMessage } from "@/lib/auth-urls";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialError = decodeAuthMessage(params.error);

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Loading...
        </div>
      }
    >
      <LoginCard initialError={initialError} />
    </Suspense>
  );
}
