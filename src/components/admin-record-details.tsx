import type { ReactNode } from "react";
import type {
  confirmationMembers,
  participants,
  submissions,
  teams,
  teamConfirmations,
} from "@/db/schema";
import { displayNumber, isSafeHttpUrl } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";

type ParticipantDetail = typeof participants.$inferSelect & { number: string };
type TeamMemberDetail = {
  teamId: string;
  role: string;
  position: number;
  consentedAt: Date | null;
  participant: {
    id: string;
    participantNumber: number;
    name: string;
  };
};
type TeamDetail = typeof teams.$inferSelect & {
  number: string;
  members: TeamMemberDetail[];
};
type ConfirmationDetail = typeof teamConfirmations.$inferSelect & {
  number: string;
  teamNumber: string;
  teamName: string;
  members: (typeof confirmationMembers.$inferSelect)[];
};
type SubmissionDetail = typeof submissions.$inferSelect;

const auditLabels = {
  pending: "等待审核",
  approved: "审核通过",
  rejected: "审核未通过",
} as const;

const recruitmentLabels = {
  recruiting: "招募中",
  paused: "已停止招募",
  full: "已满员",
  completed: "已完成组队",
} as const;

const materialLabels = {
  pending: "材料待检查",
  complete: "材料完整",
  incomplete: "材料不完整",
} as const;

const submissionLinkLabels: Record<string, string> = {
  githubUrl: "代码仓库",
  demoUrl: "在线演示",
  demoVideo: "演示视频",
  datasetUrl: "数据集或模型",
  pptUrl: "项目 PPT",
  docsUrl: "说明文档",
  packageUrl: "安装包",
  coverUrl: "项目封面",
  supplementaryUrl: "补充附件",
};

const dateTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Shanghai",
});

function text(value: string) {
  return value.trim() || "未填写";
}

function dateTime(value: Date | null) {
  return value ? dateTimeFormatter.format(value) : "无";
}

function StatusBadge({ children }: { children: ReactNode }) {
  return <Badge variant="outline">{children}</Badge>;
}

function Tags({ values }: { values: string[] }) {
  if (!values.length)
    return <span className="text-muted-foreground">未填写</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value, index) => (
        <Badge key={`${value}-${index}`} variant="outline">
          {value}
        </Badge>
      ))}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h3 className="font-display text-base font-bold">{title}</h3>
      {children}
    </section>
  );
}

function DetailGrid({
  items,
}: {
  items: { label: string; value: ReactNode; wide?: boolean }[];
}) {
  return (
    <dl className="grid gap-px overflow-hidden rounded-lg border border-primary/15 bg-primary/15 sm:grid-cols-2">
      {items.map((item) => (
        <div
          key={item.label}
          className={`min-w-0 bg-white/85 p-3 ${item.wide ? "sm:col-span-2" : ""}`}
        >
          <dt className="label-mono text-[10px] text-muted-foreground">
            {item.label}
          </dt>
          <dd className="mt-1 min-w-0 text-sm leading-relaxed whitespace-pre-wrap break-words">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ParticipantRecordDetails({
  participant,
}: {
  participant: ParticipantDetail;
}) {
  return (
    <div className="space-y-6">
      <DetailSection title="身份与报名">
        <DetailGrid
          items={[
            { label: "参赛编号", value: participant.number },
            { label: "姓名", value: participant.name },
            { label: "手机号", value: participant.phone },
            { label: "联系邮箱", value: participant.email },
            { label: "学校", value: participant.school },
            { label: "学院", value: participant.college },
            { label: "年级", value: participant.grade },
            { label: "学号", value: participant.studentId },
            {
              label: "校内身份",
              value: participant.isInternal ? "校内学生" : "校外参赛者",
            },
            { label: "报名方式", value: participant.registrationMethod },
            { label: "队内角色", value: text(participant.teamRole) },
            { label: "可投入时间", value: text(participant.availableTime) },
          ]}
        />
      </DetailSection>

      <DetailSection title="能力与方向">
        <DetailGrid
          items={[
            { label: "技能标签", value: <Tags values={participant.skills} /> },
            {
              label: "熟悉技术",
              value: <Tags values={participant.techStack} />,
            },
            {
              label: "希望承担角色",
              value: <Tags values={participant.desiredRoles} />,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="经历与介绍">
        <DetailGrid
          items={[
            {
              label: "项目经历",
              value: text(participant.projectExperience),
              wide: true,
            },
            {
              label: "个人简介",
              value: text(participant.bio),
              wide: true,
            },
            {
              label: "GitHub 或作品集",
              value: isSafeHttpUrl(participant.portfolioUrl) ? (
                <a
                  href={participant.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-primary underline underline-offset-2"
                >
                  {participant.portfolioUrl}
                </a>
              ) : (
                "未填写"
              ),
              wide: true,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="公开与审核">
        <DetailGrid
          items={[
            {
              label: "公开展示",
              value: participant.publicDisplay ? "已授权公开" : "未授权公开",
            },
            {
              label: "公开联系方式",
              value: text(participant.publicContact),
            },
            {
              label: "审核状态",
              value: (
                <StatusBadge>
                  {auditLabels[participant.auditStatus]}
                </StatusBadge>
              ),
            },
            {
              label: "审核说明",
              value: text(participant.adminNote),
              wide: true,
            },
            { label: "提交时间", value: dateTime(participant.createdAt) },
            { label: "最后更新", value: dateTime(participant.updatedAt) },
          ]}
        />
      </DetailSection>
    </div>
  );
}

export function TeamRecordDetails({ team }: { team: TeamDetail }) {
  const leader = team.members.find(
    (member) => member.participant.id === team.leaderParticipantId,
  );
  const confirmedMembers = team.members.filter(
    (member) => member.consentedAt,
  ).length;

  return (
    <div className="space-y-6">
      <DetailSection title="队伍状态">
        <DetailGrid
          items={[
            { label: "队伍编号", value: team.number },
            { label: "队伍名称", value: team.name },
            {
              label: "队长",
              value: leader
                ? `${displayNumber("P", leader.participant.participantNumber)} · ${leader.participant.name}`
                : "成员记录中未找到队长",
            },
            {
              label: "审核状态",
              value: <StatusBadge>{auditLabels[team.auditStatus]}</StatusBadge>,
            },
            {
              label: "招募状态",
              value: (
                <StatusBadge>
                  {recruitmentLabels[team.recruitStatus]}
                </StatusBadge>
              ),
            },
            {
              label: "公开展示",
              value:
                team.publicDisplay && team.publicConsentAt
                  ? "已授权公开"
                  : "未授权公开",
            },
            { label: "公开授权时间", value: dateTime(team.publicConsentAt) },
            { label: "招募截止日期", value: team.recruitmentDeadline },
            { label: "最大人数", value: `${team.maxSize} 人` },
            {
              label: "成员情况",
              value: `${team.members.length} 人，其中 ${confirmedMembers} 人已确认`,
            },
            {
              label: "校外成员",
              value: team.allowExternal ? "允许" : "不允许",
            },
            { label: "公开联系渠道", value: team.contact },
          ]}
        />
      </DetailSection>

      <DetailSection title="项目与招募">
        <DetailGrid
          items={[
            { label: "所属赛道", value: <Tags values={team.track} /> },
            { label: "项目方向", value: text(team.projectDirection) },
            { label: "设想成熟度", value: text(team.maturity) },
            { label: "已有能力", value: <Tags values={team.capabilities} /> },
            {
              label: "招募角色",
              value: <Tags values={team.requiredRoles} />,
            },
            { label: "技术栈", value: <Tags values={team.techStack} /> },
            {
              label: "队伍介绍",
              value: text(team.description),
              wide: true,
            },
            {
              label: "招募要求",
              value: text(team.requirements),
              wide: true,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="成员名单">
        {team.members.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {team.members.map((member) => (
              <div
                key={member.participant.id}
                className="rounded-lg border border-primary/15 bg-white/85 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {displayNumber("P", member.participant.participantNumber)}{" "}
                      · {member.participant.name}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      位置 {member.position} ·{" "}
                      {member.consentedAt
                        ? `已确认于 ${dateTime(member.consentedAt)}`
                        : "待本人确认"}
                    </p>
                  </div>
                  <Badge variant="outline">{member.role}</Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            暂无成员记录。
          </p>
        )}
      </DetailSection>

      <DetailSection title="赛事记录">
        <DetailGrid
          items={[
            { label: "最终项目名称", value: text(team.finalProjectName) },
            { label: "最终项目方向", value: text(team.finalProjectDirection) },
            { label: "异常说明", value: text(team.exception), wide: true },
            { label: "创建时间", value: dateTime(team.createdAt) },
            { label: "最后更新", value: dateTime(team.updatedAt) },
          ]}
        />
      </DetailSection>
    </div>
  );
}

export function ConfirmationRecordDetails({
  confirmation,
}: {
  confirmation: ConfirmationDetail;
}) {
  return (
    <div className="space-y-6">
      <DetailSection title="最终确认状态">
        <DetailGrid
          items={[
            { label: "确认编号", value: confirmation.number },
            { label: "队伍编号", value: confirmation.teamNumber },
            { label: "队伍名称", value: confirmation.teamName },
            {
              label: "审核状态",
              value: (
                <StatusBadge>
                  {auditLabels[confirmation.auditStatus]}
                </StatusBadge>
              ),
            },
            { label: "提交时间", value: dateTime(confirmation.createdAt) },
            { label: "最后更新", value: dateTime(confirmation.updatedAt) },
            {
              label: "异常说明",
              value: text(confirmation.exception),
              wide: true,
            },
          ]}
        />
      </DetailSection>
      <DetailSection title="成员快照">
        {confirmation.members.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {confirmation.members.map((member) => (
              <div
                key={member.participantId}
                className="rounded-lg border border-primary/15 bg-white/85 p-3"
              >
                <p className="font-semibold">
                  {displayNumber("P", member.participantNumber)} · {member.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  位置 {member.position} · {member.role}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            暂无成员快照。
          </p>
        )}
      </DetailSection>
    </div>
  );
}

export function SubmissionRecordDetails({
  submission,
}: {
  submission: SubmissionDetail;
}) {
  const links = Object.entries(submission.links).filter(([, value]) => value);
  return (
    <div className="space-y-6">
      <DetailSection title="作品概况">
        <DetailGrid
          items={[
            {
              label: "作品编号",
              value: displayNumber("S", submission.submissionNumber),
            },
            { label: "作品名称", value: submission.projectName },
            { label: "所属赛道", value: submission.track },
            { label: "队伍 ID", value: submission.teamId },
            { label: "提交人 ID", value: submission.submittedById },
            {
              label: "一句话介绍",
              value: submission.oneLiner,
              wide: true,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="项目说明">
        <DetailGrid
          items={[
            { label: "项目背景", value: submission.background, wide: true },
            {
              label: "解决的问题",
              value: submission.problemSolved,
              wide: true,
            },
            {
              label: "核心功能",
              value: submission.coreFeatures,
              wide: true,
            },
            {
              label: "技术方案",
              value: submission.techApproach,
              wide: true,
            },
            { label: "创新点", value: submission.innovation, wide: true },
            {
              label: "应用价值",
              value: submission.applicationValue,
              wide: true,
            },
            {
              label: "使用说明",
              value: submission.usageGuide,
              wide: true,
            },
          ]}
        />
      </DetailSection>

      <DetailSection title="材料链接">
        {links.length ? (
          <DetailGrid
            items={links.map(([key, value]) => ({
              label: submissionLinkLabels[key] ?? key,
              value: isSafeHttpUrl(value) ? (
                <a
                  href={value}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-primary underline underline-offset-2"
                >
                  {value}
                </a>
              ) : (
                "链接格式无效"
              ),
              wide: true,
            }))}
          />
        ) : (
          <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            未提交材料链接。
          </p>
        )}
      </DetailSection>

      <DetailSection title="公开与审核">
        <DetailGrid
          items={[
            {
              label: "公开展示",
              value:
                submission.publicDisplay && submission.publicConsentAt
                  ? "已授权公开"
                  : "未授权公开",
            },
            {
              label: "材料状态",
              value: (
                <StatusBadge>
                  {materialLabels[submission.materialStatus]}
                </StatusBadge>
              ),
            },
            {
              label: "审核状态",
              value: (
                <StatusBadge>{auditLabels[submission.auditStatus]}</StatusBadge>
              ),
            },
            {
              label: "审核说明",
              value: text(submission.adminNote),
              wide: true,
            },
            { label: "提交时间", value: dateTime(submission.createdAt) },
            { label: "最后更新", value: dateTime(submission.updatedAt) },
          ]}
        />
      </DetailSection>
    </div>
  );
}
