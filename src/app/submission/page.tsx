import { requireUser } from "@/lib/authz";
import {
  confirmationForTeam,
  submissionForTeam,
  teamForLeader,
} from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { SubmissionForm } from "@/components/forms/submission-form";
import { EmptyState } from "@/components/empty-state";
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
      <SubmissionForm submission={submission} />
    </div>
  );
}
