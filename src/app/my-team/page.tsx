import Link from "next/link";
import {
  applicationsForLeader,
  applicationsForUser,
  teamForLeader,
} from "@/lib/queries";
import { requireUser } from "@/lib/authz";
import { closeMyTeam, withdrawApplication } from "@/app/actions";
import { displayNumber } from "@/lib/domain";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderForm } from "@/components/forms/leader-form";
export default async function MyTeamPage() {
  const user = await requireUser("/my-team");
  const [owned, mine, received] = await Promise.all([
    teamForLeader(user.id),
    applicationsForUser(user.id),
    applicationsForLeader(user.id),
  ]);
  return (
    <>
      <PageHeading
        eyebrow="MY TEAM"
        title="我的队伍与申请"
        description="管理自己创建的队伍，或查看已提交的入队申请。"
      />
      {owned ? (
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <p className="eyebrow mb-2 text-primary">CURRENT TEAM</p>
                <Badge variant="outline" className="nums">
                  {displayNumber("T", owned.team.teamNumber)}
                </Badge>
                <CardTitle className="mt-3 text-2xl">
                  {owned.team.name}
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="border-success/25 bg-success/10 text-success"
              >
                {owned.team.recruitStatus}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-px overflow-hidden rounded-lg border border-primary/15 bg-primary/15 sm:grid-cols-2">
              {owned.members.map(({ participant, role }) => (
                <div key={participant.id} className="bg-white/85 p-4 text-sm">
                  {participant.name}
                  <span className="label-mono float-right text-[10px] text-muted-foreground">
                    {role}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/create">编辑队伍</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/final-confirmation">最终确认</Link>
              </Button>
              <form action={closeMyTeam}>
                <Button type="submit" variant="destructive">
                  停止招募
                </Button>
              </form>
            </div>
            {owned.members.length > 1 && (
              <div className="mt-6 border-t pt-5">
                <LeaderForm />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="你还没有创建队伍"
          description="你可以创建队伍，或从队伍大厅申请加入。"
        />
      )}
      <section className="mt-10 border-t border-primary/15 pt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-xl font-semibold">我提交的申请</h2>
          <span className="label-mono text-[10px] text-muted-foreground">
            SENT · {String(mine.length).padStart(2, "0")}
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {mine.length ? (
            mine.map(({ application, teamName }) => (
              <div
                key={application.id}
                className="flex items-center justify-between rounded-lg border border-primary/15 bg-white/75 p-4 shadow-xs"
              >
                <div>
                  <p className="font-medium">{teamName}</p>
                  <p className="text-xs text-muted-foreground">
                    {application.status} ·{" "}
                    {application.createdAt.toLocaleDateString()}
                  </p>
                </div>
                {application.status === "pending" && (
                  <form action={withdrawApplication.bind(null, application.id)}>
                    <Button size="sm" variant="outline">
                      撤回
                    </Button>
                  </form>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">暂无申请。</p>
          )}
        </div>
      </section>
      {owned && (
        <section className="mt-10 border-t border-primary/15 pt-8">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold">收到的申请</h2>
            <span className="label-mono text-[10px] text-muted-foreground">
              RECEIVED · {String(received.length).padStart(2, "0")}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {received.length ? (
              received.map(({ application, participant }) => (
                <div
                  key={application.id}
                  className="rounded-lg border border-primary/15 bg-white/75 p-4 shadow-xs"
                >
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
                  <p className="mt-2 text-xs">
                    联系：{participant.publicContact || "未公开"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">暂无申请。</p>
            )}
          </div>
        </section>
      )}
    </>
  );
}
