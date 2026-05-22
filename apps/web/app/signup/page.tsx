import { AuthProvider } from "@dakshinkali/auth";
import { SignupCard } from "@/components/auth/signup-card";
import { decodeAuthMessage } from "@/lib/auth-urls";

type SignupPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const metadata = {
  title: "Sign Up | Dakshinkali Electronics",
  description: "Create your Dakshinkali Electronics account",
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;
  const initialError = decodeAuthMessage(params.error);

  return (
    <AuthProvider>
      <SignupCard initialError={initialError} />
    </AuthProvider>
  );
}
