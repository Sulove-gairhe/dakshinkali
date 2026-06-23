export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-6">
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
      ) : null}
      <h1 className="mt-1 text-2xl font-semibold text-slate-950">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          {description}
        </p>
      ) : null}
    </header>
  );
}
