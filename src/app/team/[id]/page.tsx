import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { teamDetail } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { ApplicationForm } from "@/components/application-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [detail, session] = await Promise.all([teamDetail(id), auth()]);
  if (!detail) notFound();
  const { team, leaderName, members } = detail;
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
            {team.recruitStatus}
          </Badge>
        </div>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
          {team.name}
        </h1>
        <p className="label-mono mt-3 text-[11px] text-muted-foreground">
          队长 · {leaderName} · {members.length}/{team.maxSize} 人
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
          </div>
        </CardContent>
      </Card>
      {session?.user &&
        team.recruitStatus === "recruiting" &&
        members.length < team.maxSize && (
          <Card>
            <CardHeader>
              <p className="eyebrow text-primary">APPLICATION</p>
              <CardTitle>申请加入</CardTitle>
            </CardHeader>
            <CardContent>
              <ApplicationForm teamId={team.id} />
            </CardContent>
          </Card>
        )}
    </div>
  );
}
