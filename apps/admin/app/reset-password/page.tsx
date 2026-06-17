import { AdminResetPasswordForm } from "@/components/admin-reset-password-form";

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
    <AdminResetPasswordForm
      email={params.email ?? ""}
      token={params.token ?? ""}
    />
  );
}
