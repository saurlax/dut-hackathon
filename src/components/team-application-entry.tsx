import Link from "next/link";
import { ApplicationForm } from "@/components/application-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isRecruitmentOpen } from "@/lib/domain";

export const recruitmentLabels = {
  recruiting: "招募中",
  paused: "已暂停招募",
  full: "已满员",
  completed: "已完成组队",
} as const;

export type TeamApplicationContext = {
  participant: {
    auditStatus: "pending" | "approved" | "rejected";
    adminNote: string;
    isInternal: boolean;
  };
  membershipTeamId: string | null;
  pendingApplication: { id: string } | null;
  activeApplicationCount: number;
} | null;

export function TeamApplicationEntry({
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
  context: TeamApplicationContext;
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
        title={rejected ? "报名资料已被下架" : "报名资料暂不可用"}
        description={
          rejected
            ? context.participant.adminNote ||
              "请修改报名资料后等待管理员恢复。"
            : "资料暂不可用，请稍后在“我的报名”查看状态。"
        }
        href="/my-registration"
        actionLabel="查看报名状态"
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
