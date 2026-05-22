import { AuthProvider } from "@dakshinkali/auth";
import { LoginCard } from "@/components/auth/login-card";
import { decodeAuthMessage } from "@/lib/auth-urls";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const initialError = decodeAuthMessage(params.error);

  return (
    <AuthProvider>
      <LoginCard initialError={initialError} />
    </AuthProvider>
  );
}
