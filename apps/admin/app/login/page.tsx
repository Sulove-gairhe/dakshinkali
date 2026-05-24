import { Suspense } from "react";
import { AdminLoginForm } from "@/components/admin-login-form";
import { decodeAuthMessage } from "@/lib/auth-urls";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialError = decodeAuthMessage(params.error);

  return (
    <Suspense fallback={<p style={{ padding: 24 }}>Loading...</p>}>
      <AdminLoginForm initialError={initialError} />
    </Suspense>
  );
}
