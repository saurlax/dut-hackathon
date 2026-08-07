import { Inbox } from "lucide-react";
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed bg-white/50 px-6 py-16 text-center">
      <Inbox className="mx-auto size-10 text-muted-foreground" />
      <h2 className="mt-4 font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
