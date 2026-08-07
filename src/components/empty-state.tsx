import { Inbox } from "lucide-react";
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="paper-grain rounded-xl border border-dashed border-primary/25 bg-white/60 px-6 py-16 text-center shadow-xs">
      <span className="mx-auto grid size-12 place-items-center rounded-lg bg-secondary text-primary ring-1 ring-inset ring-primary/15">
        <Inbox className="size-6" />
      </span>
      <p className="eyebrow mt-5 text-primary">NO DATA</p>
      <h2 className="mt-2 font-display text-xl font-semibold">{title}</h2>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
