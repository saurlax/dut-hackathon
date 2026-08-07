import { requireUser } from "@/lib/authz";
import { confirmationForTeam, teamForLeader } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { PageHeading } from "@/components/page-heading";
import { ConfirmationForm } from "@/components/forms/confirmation-form";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default async function ConfirmationPage() {
  const user = await requireUser("/final-confirmation");
  const owned = await teamForLeader(user.id);
  if (!owned)
    return (
      <>
        <PageHeading
          eyebrow="FINAL CONFIRMATION"
          title="最终组队确认"
          description="仅队长可以提交。"
        />
        <EmptyState
          title="没有可确认的队伍"
          description="创建并完善队伍后再进行最终确认。"
        />
      </>
    );
  const existing = await confirmationForTeam(owned.team.id);
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        eyebrow="FINAL CONFIRMATION"
        title="确认最终参赛阵容"
        description="提交后将锁定当前成员快照，并停止招募。"
      />
      <Card className="border-primary/20">
        <CardHeader>
          <p className="eyebrow text-primary">FINAL ROSTER</p>
          <div className="flex justify-between">
            <CardTitle>{owned.team.name}</CardTitle>
            <Badge variant="outline" className="nums">
              {displayNumber("T", owned.team.teamNumber)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-primary/10 overflow-hidden rounded-lg border border-primary/15 bg-white/65">
            {owned.members.map(({ participant, role }) => (
              <li key={participant.id} className="p-4">
                <span className="nums mr-2 text-xs text-primary">
                  {displayNumber("P", participant.participantNumber)}
                </span>
                {participant.name}
                <span className="label-mono float-right text-[10px] text-muted-foreground">
                  {role}
                </span>
              </li>
            ))}
          </ul>
          {existing && (
            <p className="mt-5 text-sm text-muted-foreground">
              已提交，审核状态：{existing.confirmation.auditStatus}
            </p>
          )}
          <div className="mt-6">
            <ConfirmationForm />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
