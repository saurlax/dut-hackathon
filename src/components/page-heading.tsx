export function PageHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-8 max-w-3xl border-b border-primary/15 pb-6">
      <p className="eyebrow mb-2 text-primary">{eyebrow}</p>
      <h1 className="font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}
