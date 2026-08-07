import { requireUser } from "@/lib/authz";
import { participantForUser, teamForLeader } from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { TeamForm } from "@/components/forms/team-form";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";
import { Button } from "@/components/ui/button";
export default async function CreateTeamPage() {
  const user = await requireUser("/create");
  const [participant, owned] = await Promise.all([
    participantForUser(user.id),
    teamForLeader(user.id),
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
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeading
        eyebrow="CREATE TEAM"
        title={owned ? "编辑队伍资料" : "创建一支队伍"}
        description="清晰的项目方向与公开联系方式，会让合适的伙伴更容易找到你。"
      />
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
    </div>
  );
}
