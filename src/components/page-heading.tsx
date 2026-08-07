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
    <div className="mb-8 max-w-3xl">
      <p className="eyebrow mb-2">{eyebrow}</p>
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-muted-foreground">{description}</p>
    </div>
  );
}
