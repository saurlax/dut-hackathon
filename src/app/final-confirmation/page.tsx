import { requireUser } from "@/lib/authz";
import { confirmationForTeam, teamForLeader } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { PageHeading } from "@/components/page-heading";
import { ConfirmationForm } from "@/components/forms/confirmation-form";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const auditLabels = {
  pending: "等待审核",
  approved: "审核通过",
  rejected: "审核未通过",
} as const;

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
  const hasUnconfirmedMembers = owned.members.some(
    ({ consentedAt }) => !consentedAt,
  );
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
            {owned.members.map(({ participant, role, consentedAt }) => (
              <li key={participant.id} className="p-4">
                <span className="nums mr-2 text-xs text-primary">
                  {displayNumber("P", participant.participantNumber)}
                </span>
                {participant.name}
                <span className="label-mono float-right text-[10px] text-muted-foreground">
                  {consentedAt ? role : "待本人确认"}
                </span>
              </li>
            ))}
          </ul>
          {existing && (
            <div className="mt-5 space-y-2">
              <p className="rounded-lg border border-primary/15 bg-secondary/50 p-4 text-sm">
                已提交，审核状态：
                <span className="font-semibold">
                  {auditLabels[existing.confirmation.auditStatus]}
                </span>
              </p>
              {existing.confirmation.auditStatus === "rejected" &&
                existing.confirmation.exception && (
                  <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                    <span className="font-semibold">驳回原因：</span>
                    {existing.confirmation.exception}
                  </p>
                )}
            </div>
          )}
          {hasUnconfirmedMembers ? (
            <p className="mt-5 rounded-lg border border-warning/25 bg-warning/10 p-4 text-sm text-warning">
              仍有成员尚未本人确认加入；确认或退出完成前不能锁定阵容。
            </p>
          ) : !existing || existing.confirmation.auditStatus === "rejected" ? (
            <div className="mt-6">
              <ConfirmationForm
                resubmission={existing?.confirmation.auditStatus === "rejected"}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-muted-foreground">
              {existing.confirmation.auditStatus === "approved"
                ? "最终阵容已经锁定并审核通过，无需重复提交。"
                : "最终阵容正在审核中，请等待管理员处理。"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
