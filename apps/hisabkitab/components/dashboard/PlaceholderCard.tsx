import type { LucideIcon } from "lucide-react";

export function PlaceholderCard({
  title,
  phase,
  icon: Icon,
}: {
  title: string;
  phase: string;
  icon: LucideIcon;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">Available in {phase}.</p>
        </div>
        <div className="grid size-10 place-items-center rounded-lg bg-slate-100 text-primary">
          <Icon className="size-5" />
        </div>
      </div>
    </article>
  );
}
