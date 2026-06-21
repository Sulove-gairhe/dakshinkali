import { PageHeader } from "@/components/shared/PageHeader";

export function PlaceholderModulePage({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <div>
      <PageHeader
        eyebrow={phase}
        title={title}
        description="This route is intentionally a placeholder in HisabKitab Phase 1. It performs no future-module database reads or writes."
      />
      <section className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-panel">
        <p className="text-sm font-semibold text-primary">
          Available in {phase}
        </p>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
          The navigation entry is present for orientation only. Functional
          workflows will be added in an approved later phase.
        </p>
      </section>
    </div>
  );
}
