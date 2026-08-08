import Link from "next/link";
import {
  applicationsForLeader,
  applicationsForUser,
  teamForLeader,
  teamForUser,
} from "@/lib/queries";
import { requireUser } from "@/lib/authz";
import { withdrawApplication } from "@/app/actions";
import { displayNumber, isRecruitmentOpen } from "@/lib/domain";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LeaderForm } from "@/components/forms/leader-form";
import { ApplicationReviewButtons } from "@/components/application-review-buttons";
import { MembershipActions } from "@/components/membership-actions";
import { RecruitmentControl } from "@/components/recruitment-control";

const recruitmentLabels = {
  recruiting: "招募中",
  paused: "已停止招募",
  full: "已满员",
  completed: "已完成组队",
} as const;

const auditLabels = {
  pending: "待恢复公开",
  approved: "已公开可用",
  rejected: "已被下架",
} as const;

function teamHallStatus(team: {
  publicDisplay: boolean;
  publicConsentAt: Date | null;
  auditStatus: keyof typeof auditLabels;
  recruitStatus: keyof typeof recruitmentLabels;
  recruitmentDeadline: string;
}) {
  const blockers: string[] = [];
  if (!team.publicDisplay || !team.publicConsentAt) blockers.push("未授权公开");
  if (team.auditStatus === "pending") blockers.push("待恢复公开");
  if (team.auditStatus === "rejected") blockers.push("已被下架");
  if (team.recruitStatus !== "recruiting")
    blockers.push(recruitmentLabels[team.recruitStatus]);
  if (
    team.recruitStatus === "recruiting" &&
    !isRecruitmentOpen(team.recruitmentDeadline)
  )
    blockers.push("招募截止日期已过");

  return blockers.length
    ? {
        visible: false,
        message: `当前不会显示在组队大厅：${blockers.join("、")}。`,
      }
    : { visible: true, message: "当前已显示在组队大厅。" };
}

export default async function MyTeamPage() {
  const user = await requireUser("/my-team");
  const [current, owned, mine] = await Promise.all([
    teamForUser(user.id),
    teamForLeader(user.id),
    applicationsForUser(user.id),
  ]);
  const received = owned ? await applicationsForLeader(user.id) : [];
  const hallStatus = current ? teamHallStatus(current.team) : null;
  return (
    <>
      <PageHeading
        eyebrow="MY TEAM"
        title="我的队伍与申请"
        description="队长通过申请审批添加成员；成员可以确认历史关系或随时退出未锁定的队伍。"
      />
      {current ? (
        <Card className="mb-8 border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow mb-2 text-primary">CURRENT TEAM</p>
                <Badge variant="outline" className="nums">
                  {displayNumber("T", current.team.teamNumber)}
                </Badge>
                <CardTitle className="mt-3 text-2xl">
                  {current.team.name}
                </CardTitle>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Badge
                  variant="outline"
                  className={
                    current.team.recruitStatus === "recruiting"
                      ? "border-success/25 bg-success/10 text-success"
                      : "border-warning/25 bg-warning/10 text-warning"
                  }
                >
                  {recruitmentLabels[current.team.recruitStatus]}
                </Badge>
                <Badge variant="outline">
                  {auditLabels[current.team.auditStatus]}
                </Badge>
                <Badge variant="outline">
                  {current.team.publicDisplay && current.team.publicConsentAt
                    ? "已授权公开"
                    : "未公开"}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hallStatus && (
              <div
                role="status"
                className={`mb-5 rounded-lg border p-3 text-sm ${
                  hallStatus.visible
                    ? "border-success/20 bg-success/10 text-success"
                    : "border-warning/20 bg-warning/10 text-warning"
                }`}
              >
                {hallStatus.message}
              </div>
            )}
            {current.team.auditStatus === "rejected" &&
              current.team.exception && (
                <div className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  <span className="font-semibold">已被下架：</span>
                  {current.team.exception}
                </div>
              )}
            <div className="grid gap-px overflow-hidden rounded-lg border border-primary/15 bg-primary/15 sm:grid-cols-2">
              {current.members.map(({ participant, role, consentedAt }) => (
                <div key={participant.id} className="bg-white/85 p-4 text-sm">
                  {participant.name}
                  <span className="label-mono float-right text-[10px] text-muted-foreground">
                    {consentedAt ? role : "待本人确认"}
                  </span>
                </div>
              ))}
            </div>
            {owned ? (
              <>
                <div className="mt-5 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/create">编辑队伍</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/final-confirmation">最终确认</Link>
                  </Button>
                  <RecruitmentControl
                    status={current.team.recruitStatus}
                    canResume={
                      isRecruitmentOpen(current.team.recruitmentDeadline) &&
                      current.members.length < current.team.maxSize
                    }
                  />
                </div>
                {owned.members.filter(({ consentedAt }) => consentedAt).length >
                  1 && (
                  <div className="mt-6 border-t pt-5">
                    <LeaderForm />
                  </div>
                )}
              </>
            ) : (
              <div className="mt-5 border-t border-primary/10 pt-5">
                <MembershipActions
                  confirmed={Boolean(current.membership.consentedAt)}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <EmptyState
          title="你还没有加入队伍"
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
                  {application.status === "pending" && (
                    <ApplicationReviewButtons applicationId={application.id} />
                  )}
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
