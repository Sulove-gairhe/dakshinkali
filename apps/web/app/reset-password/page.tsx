import { ResetPasswordCard } from "@/components/auth/reset-password-card";

type ResetPasswordPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <ResetPasswordCard
      email={params.email ?? ""}
      token={params.token ?? ""}
    />
  );
}
