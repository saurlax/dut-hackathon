import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { publicTeamDetail, teamApplicationContext } from "@/lib/queries";
import { displayNumber, isRecruitmentOpen } from "@/lib/domain";
import { ApplicationForm } from "@/components/application-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const recruitmentLabels = {
  recruiting: "招募中",
  paused: "已暂停招募",
  full: "已满员",
  completed: "已完成组队",
} as const;

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, session] = await Promise.all([publicTeamDetail(id), auth()]);
  if (!detail) notFound();
  const { team, leaderName, members, currentSize } = detail;
  const applicationContext = session?.user?.id
    ? await teamApplicationContext(session.user.id, team.id)
    : null;
  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <Link
        href="/browse-teams"
        className="label-mono inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        返回队伍大厅
      </Link>
      <div className="border-b border-primary/15 pb-8">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="nums">
            {displayNumber("T", team.teamNumber)}
          </Badge>
          <Badge
            variant="outline"
            className={
              team.recruitStatus === "recruiting"
                ? "border-success/25 bg-success/10 text-success"
                : "border-warning/25 bg-warning/10 text-warning"
            }
          >
            {recruitmentLabels[team.recruitStatus]}
          </Badge>
        </div>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
          {team.name}
        </h1>
        <p className="label-mono mt-3 text-[11px] text-muted-foreground">
          队长 · {leaderName} · {currentSize}/{team.maxSize} 人
        </p>
      </div>
      <Card>
        <CardHeader>
          <p className="eyebrow text-primary">PROJECT &amp; RECRUITMENT</p>
          <CardTitle>项目与招募</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg border border-primary/15 bg-white/55 p-4">
              <h2 className="label-mono text-[10px] text-primary">DIRECTION</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {team.projectDirection || "暂未确定"}
              </p>
            </div>
            <div className="rounded-lg border border-primary/15 bg-white/55 p-4">
              <h2 className="label-mono text-[10px] text-primary">CONTACT</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {team.contact}
              </p>
            </div>
          </div>
          <div className="rule-ink pt-5">
            <h2 className="font-display text-lg font-semibold">队伍介绍</h2>
            <p className="mt-1 text-muted-foreground">{team.description}</p>
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">招募要求</h2>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {team.requirements || "暂无额外要求"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {team.techStack.map((tag) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
          <Separator />
          <div>
            <h2 className="font-display text-lg font-semibold">当前成员</h2>
            {members.length ? (
              <ul className="mt-3 grid gap-px overflow-hidden rounded-lg border border-primary/15 bg-primary/15 sm:grid-cols-2">
                {members.map(({ participant, role }) => (
                  <li key={participant.id} className="bg-white/85 p-4 text-sm">
                    {participant.name}
                    <span className="label-mono float-right text-[10px] text-muted-foreground">
                      {role}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                成员尚未授权公开个人信息。
              </p>
            )}
            {currentSize > members.length && (
              <p className="mt-2 text-xs text-muted-foreground">
                另有 {currentSize - members.length} 名成员未公开姓名。
              </p>
            )}
          </div>
        </CardContent>
      </Card>
      <ApplicationEntry
        teamId={team.id}
        recruitStatus={team.recruitStatus}
        recruitmentDeadline={team.recruitmentDeadline}
        allowExternal={team.allowExternal}
        currentSize={currentSize}
        maxSize={team.maxSize}
        authenticated={Boolean(session?.user?.id)}
        context={applicationContext}
      />
    </div>
  );
}

type ApplicationContext = Awaited<ReturnType<typeof teamApplicationContext>>;

function ApplicationEntry({
  teamId,
  recruitStatus,
  recruitmentDeadline,
  allowExternal,
  currentSize,
  maxSize,
  authenticated,
  context,
}: {
  teamId: string;
  recruitStatus: keyof typeof recruitmentLabels;
  recruitmentDeadline: string;
  allowExternal: boolean;
  currentSize: number;
  maxSize: number;
  authenticated: boolean;
  context: ApplicationContext;
}) {
  if (context?.membershipTeamId) {
    const currentTeam = context.membershipTeamId === teamId;
    return (
      <ApplicationNotice
        title={currentTeam ? "你已经在这支队伍中" : "你已经加入其他队伍"}
        description={
          currentTeam
            ? "可前往“我的队伍”查看成员状态和后续安排。"
            : "每位参赛者只能加入一支队伍；如需申请本队，请先处理当前队伍关系。"
        }
        href="/my-team"
        actionLabel="查看我的队伍"
      />
    );
  }

  if (context?.pendingApplication) {
    return (
      <ApplicationNotice
        title="申请已提交"
        description="队长尚未处理这份申请。你可以在“我的队伍”中查看状态或撤回申请。"
        href="/my-team"
        actionLabel="查看申请状态"
      />
    );
  }

  if (
    recruitStatus !== "recruiting" ||
    !isRecruitmentOpen(recruitmentDeadline) ||
    currentSize >= maxSize
  ) {
    const description =
      currentSize >= maxSize
        ? "队伍已经满员，暂时不能接收新申请。"
        : !isRecruitmentOpen(recruitmentDeadline)
          ? "招募截止日期已过，暂时不能提交申请。"
          : "队长当前暂停了新成员申请。";
    return (
      <ApplicationNotice
        title="当前不可申请"
        description={description}
        href="/browse-teams"
        actionLabel="浏览其他队伍"
      />
    );
  }

  if (!authenticated) {
    return (
      <ApplicationNotice
        title="登录后申请加入"
        description="使用邮箱登录后，我们会继续带你回到这支队伍。"
        href={`/login?callbackUrl=${encodeURIComponent(`/team/${teamId}`)}`}
        actionLabel="邮箱登录"
      />
    );
  }

  if (!context) {
    return (
      <ApplicationNotice
        title="先完成参赛报名"
        description="队长需要通过报名资料核验申请人身份。完成报名后即可回来申请。"
        href="/register"
        actionLabel="填写报名资料"
      />
    );
  }

  if (context.participant.auditStatus !== "approved") {
    const rejected = context.participant.auditStatus === "rejected";
    return (
      <ApplicationNotice
        title={rejected ? "报名资料审核未通过" : "报名资料正在审核"}
        description={
          rejected
            ? context.participant.adminNote || "请修改报名资料后重新提交审核。"
            : "审核通过后才能申请队伍，请稍后在“我的报名”查看状态。"
        }
        href={rejected ? "/register" : "/my-registration"}
        actionLabel={rejected ? "修改报名资料" : "查看报名状态"}
      />
    );
  }

  if (context.activeApplicationCount >= 3) {
    return (
      <ApplicationNotice
        title="待处理申请已达上限"
        description="每位参赛者最多同时保留三份待处理申请；请先撤回或等待现有申请处理。"
        href="/my-team"
        actionLabel="管理我的申请"
      />
    );
  }

  if (!allowExternal && !context.participant.isInternal) {
    return (
      <ApplicationNotice
        title="这支队伍仅接受校内成员"
        description="你的报名资料当前登记为校外参赛者，因此不能申请这支队伍。"
        href="/browse-teams"
        actionLabel="浏览其他队伍"
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <p className="eyebrow text-primary">APPLICATION</p>
        <CardTitle>申请加入</CardTitle>
      </CardHeader>
      <CardContent>
        <ApplicationForm teamId={teamId} />
      </CardContent>
    </Card>
  );
}

function ApplicationNotice({
  title,
  description,
  href,
  actionLabel,
}: {
  title: string;
  description: string;
  href: string;
  actionLabel: string;
}) {
  return (
    <Card>
      <CardHeader>
        <p className="eyebrow text-primary">APPLICATION</p>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
        <Button className="mt-5" variant="outline" asChild>
          <Link href={href}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
