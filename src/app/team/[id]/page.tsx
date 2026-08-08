import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Mail, Send } from "lucide-react";
import { auth } from "@/auth";
import { publicTeamDetail, teamApplicationContext } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  recruitmentLabels,
  TeamApplicationEntry,
} from "@/components/team-application-entry";

// 将队长的公开联系方式映射成可点击的 href：邮箱走 mailto，手机号走 tel，
// 其余（微信/QQ 等）回到页内 CONTACT 区块，让访客手动复制。
function contactHref(contact: string): string {
  const value = contact.trim();
  if (!value) return "#contact";
  if (value.includes("@")) return `mailto:${value}`;
  const numeric = value.replace(/[\s-]/g, "");
  if (/^1[3-9]\d{9}$/.test(numeric)) return `tel:${numeric}`;
  return "#contact";
}

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
  const progressPercent =
    team.maxSize > 0 ? Math.min((currentSize / team.maxSize) * 100, 100) : 0;
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-36">
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
          队长 · {leaderName}
        </p>
        <div className="mt-5">
          <div className="mb-1.5 flex items-center justify-between text-[11px]">
            <span className="label-mono text-muted-foreground">
              成员进度 · SIZE
            </span>
            <span className="nums font-bold text-foreground">
              {currentSize}/{team.maxSize} 人
            </span>
          </div>
          <div className="h-1.5 w-full bg-foreground/10">
            <div
              className="h-full bg-primary transition-[width] duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
      <Card>
        <CardHeader>
          <p className="eyebrow text-primary">PROJECT &amp; RECRUITMENT</p>
          <CardTitle>项目与招募</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-lg border border-primary/15 bg-white/55 p-4">
              <h2 className="label-mono text-[10px] text-primary">DIRECTION</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {team.projectDirection || "暂未确定"}
              </p>
            </div>
            <div
              id="contact"
              className="scroll-mt-24 rounded-lg border border-primary/15 bg-white/55 p-4"
            >
              <h2 className="label-mono text-[10px] text-primary">CONTACT</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {team.contact}
              </p>
            </div>
          </div>
          <div className="rule-ink pt-5">
            <h2 className="label-mono mb-2.5 text-[11px] text-muted-foreground">
              队伍介绍 · ABOUT
            </h2>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground/90">
              {team.description}
            </p>
          </div>
          <div>
            <h2 className="label-mono mb-2.5 text-[11px] text-muted-foreground">
              招募要求 · REQUIREMENTS
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85">
              {team.requirements || "暂无额外要求"}
            </p>
          </div>
          {team.techStack.length > 0 && (
            <div>
              <h2 className="label-mono mb-2.5 text-[11px] text-muted-foreground">
                技术栈 · STACK
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {team.techStack.map((tag) => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <Separator />
          <div>
            <h2 className="label-mono mb-2.5 text-[11px] text-muted-foreground">
              当前成员 · MEMBERS
            </h2>
            {members.length ? (
              <ul className="grid gap-px overflow-hidden rounded-lg border border-primary/15 bg-primary/15 sm:grid-cols-2">
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
              <p className="text-sm text-muted-foreground">
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
      <div id="apply" className="scroll-mt-24">
        <TeamApplicationEntry
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
      <StickyActionBar contactHref={contactHref(team.contact)} />
    </div>
  );
}

function StickyActionBar({ contactHref }: { contactHref: string }) {
  return (
    <div className="safe-area-bottom fixed inset-x-0 bottom-0 z-30 border-t border-foreground bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl gap-2 px-4 pt-3">
        <Button
          asChild
          variant="default"
          className="press-hard min-w-0 flex-1 rounded-md shadow-hard"
        >
          <a href={contactHref}>
            <Mail />
            <span className="truncate">联系队长</span>
          </a>
        </Button>
        <Button asChild variant="outline" className="min-w-0 flex-1 rounded-md">
          <a href="#apply">
            <Send />
            <span className="truncate">申请加入</span>
          </a>
        </Button>
      </div>
      <p className="mx-auto max-w-4xl px-4 pb-2 pt-1 text-center text-[11px] text-muted-foreground">
        申请不会推送站外通知，建议先使用队长公开联系方式沟通。
      </p>
    </div>
  );
}
