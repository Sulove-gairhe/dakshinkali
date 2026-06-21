import { AppShell } from "@/components/layout/AppShell";
import {
  HisabKitabForbiddenError,
  requireHisabKitabUser,
} from "@/lib/auth/requireHisabKitabUser";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const context = await requireHisabKitabUser();
    return <AppShell user={context}>{children}</AppShell>;
  } catch (error) {
    if (error instanceof HisabKitabForbiddenError) {
      return (
        <main className="grid min-h-dvh place-items-center bg-slate-50 px-4">
          <section className="max-w-md rounded-lg border border-slate-200 bg-white p-6 text-center shadow-panel">
            <p className="text-sm font-semibold text-red-600">Access denied</p>
            <h1 className="mt-2 text-xl font-semibold text-slate-950">
              HisabKitab permission required
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Staff accounts need explicit HisabKitab permission strings before
              they can enter this workspace.
            </p>
          </section>
        </main>
      );
    }

    throw error;
  }
}
