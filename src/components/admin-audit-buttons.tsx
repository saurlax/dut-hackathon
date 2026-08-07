import { updateAudit } from "@/app/actions";
import { Button } from "@/components/ui/button";
export function AdminAuditButtons({
  kind,
  id,
}: {
  kind: "participant" | "team" | "confirmation" | "submission";
  id: string;
}) {
  return (
    <div className="flex gap-1">
      <form action={updateAudit.bind(null, kind, id, "approved")}>
        <Button size="sm" variant="outline">
          通过
        </Button>
      </form>
      <form action={updateAudit.bind(null, kind, id, "rejected")}>
        <Button size="sm" variant="destructive">
          驳回
        </Button>
      </form>
    </div>
  );
}
