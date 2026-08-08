import { requireUser } from "@/lib/authz";
import { participantForUser, teamForLeader, teamForUser } from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { TeamForm } from "@/components/forms/team-form";
import { EmptyState } from "@/components/empty-state";
import { Link } from "next-view-transitions";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animation/reveal";
export default async function CreateTeamPage() {
  const user = await requireUser("/create");
  const [participant, owned, current] = await Promise.all([
    participantForUser(user.id),
    teamForLeader(user.id),
    teamForUser(user.id),
  ]);
  if (!participant)
    return (
      <>
        <PageHeading
          eyebrow="CREATE TEAM"
          title="先完成报名"
          description="队伍必须由已报名参赛者创建。"
        />
        <EmptyState
          title="缺少报名资料"
          description="请先填写报名资料，再回来创建队伍。"
        />
        <Button className="mt-4" asChild>
          <Link href="/register">去报名</Link>
        </Button>
      </>
    );
  if (current && !owned)
    return (
      <>
        <PageHeading
          eyebrow="CREATE TEAM"
          title="你已经加入队伍"
          description="每位参赛者只能加入一支队伍，队员不能同时创建新队伍。"
        />
        <EmptyState
          title={`当前队伍：${current.team.name}`}
          description="如需创建自己的队伍，请先在“我的队伍”中退出当前队伍。"
        />
        <Button className="mt-4" asChild>
          <Link href="/my-team">查看我的队伍</Link>
        </Button>
      </>
    );
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading
        eyebrow="CREATE TEAM"
        title={owned ? "编辑队伍资料" : "创建一支队伍"}
        description="清晰的项目方向与公开联系方式，会让合适的伙伴更容易找到你；勾选公开后仍需审核，修改也会重新审核。"
      />
      <Reveal>
        <TeamForm
          team={
            owned
              ? {
                  name: owned.team.name,
                  projectDirection: owned.team.projectDirection,
                  track: owned.team.track,
                  maturity: owned.team.maturity,
                  techStack: owned.team.techStack,
                  capabilities: owned.team.capabilities,
                  requiredRoles: owned.team.requiredRoles,
                  contact: owned.team.contact,
                  recruitmentDeadline: owned.team.recruitmentDeadline,
                  maxSize: owned.team.maxSize,
                  description: owned.team.description,
                  requirements: owned.team.requirements,
                  allowExternal: owned.team.allowExternal,
                  publicDisplay: owned.team.publicDisplay,
                }
              : null
          }
        />
      </Reveal>
    </div>
  );
}
