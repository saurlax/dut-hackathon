import { ApplicationReviewButtons } from "@/components/application-review-buttons";
import { Badge } from "@/components/ui/badge";
import { displayNumber } from "@/lib/domain";

export function ReceivedApplicationCard({
  application,
  participant,
}: {
  application: {
    id: string;
    status: string;
    message: string;
  };
  participant: {
    name: string;
    participantNumber: number;
  };
}) {
  return (
    <div className="rounded-lg border border-primary/15 bg-white/75 p-4 shadow-xs">
      <div className="flex justify-between">
        <p className="font-medium">
          {participant.name} ·{" "}
          {displayNumber("P", participant.participantNumber)}
        </p>
        <Badge variant="outline">{application.status}</Badge>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {application.message || "未填写留言"}
      </p>
      {application.status === "pending" && (
        <ApplicationReviewButtons applicationId={application.id} />
      )}
    </div>
  );
}
