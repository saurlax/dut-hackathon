import { requireUser } from "@/lib/authz";
import {
  confirmationForTeam,
  submissionForTeam,
  teamForLeader,
} from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { SubmissionForm } from "@/components/forms/submission-form";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";

const auditLabels = {
  pending: "等待审核",
  approved: "审核通过",
  rejected: "审核未通过",
} as const;

const materialLabels = {
  pending: "材料待检查",
  complete: "材料完整",
  incomplete: "材料不完整",
} as const;

export default async function SubmissionPage() {
  const user = await requireUser("/submission");
  const owned = await teamForLeader(user.id);
  if (!owned)
    return (
      <>
        <PageHeading
          eyebrow="SUBMISSION"
          title="作品提交"
          description="仅队长可以提交。"
        />
        <EmptyState
          title="没有可提交作品的队伍"
          description="请先创建并完成队伍。"
        />
      </>
    );
  const [confirmation, submission] = await Promise.all([
    confirmationForTeam(owned.team.id),
    submissionForTeam(owned.team.id),
  ]);
  if (!confirmation)
    return (
      <>
        <PageHeading
          eyebrow="SUBMISSION"
          title="作品提交"
          description="提交作品前需要锁定最终阵容。"
        />
        <EmptyState
          title="尚未最终确认"
          description="请先在最终确认页面提交参赛阵容。"
        />
      </>
    );
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading
        eyebrow="SUBMISSION"
        title={submission ? "更新作品资料" : "提交参赛作品"}
        description="作品默认不公开；只有明确勾选授权且审核通过后才会进入作品展示。"
      />
      {submission && (
        <div className="mb-6 space-y-3 rounded-xl border border-primary/15 bg-white/70 p-5 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">当前审核状态</span>
            <Badge variant="outline">
              {auditLabels[submission.auditStatus]}
            </Badge>
            <Badge variant="outline">
              {materialLabels[submission.materialStatus]}
            </Badge>
          </div>
          {submission.auditStatus === "rejected" && submission.adminNote && (
            <p className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              <span className="font-semibold">驳回原因：</span>
              {submission.adminNote}
            </p>
          )}
        </div>
      )}
      <SubmissionForm submission={submission} />
    </div>
  );
}
