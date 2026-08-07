import { notFound } from "next/navigation";
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex flex-wrap gap-2">
          <Badge>{displayNumber("T", team.teamNumber)}</Badge>
          <Badge variant="outline">{team.recruitStatus}</Badge>
        </div>
        <h1 className="mt-4 text-4xl font-black">{team.name}</h1>
        <p className="mt-2 text-muted-foreground">
          队长 · {leaderName} · {members.length}/{team.maxSize} 人
        </p>
      </div>
      <Card className="bg-white/75">
        <CardHeader>
          <CardTitle>项目与招募</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div>
            <h2 className="font-semibold">项目方向</h2>
            <p className="mt-1 text-muted-foreground">
              {team.projectDirection || "暂未确定"}
            </p>
          </div>
          <div>
            <h2 className="font-semibold">队伍介绍</h2>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {team.description}
            </p>
          </div>
          <div>
            <h2 className="font-semibold">招募要求</h2>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
              {team.requirements || "暂无额外要求"}
            </p>
          </div>
          <div className="flex flex-wrap gap-1">
            {team.techStack.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          <Separator />
          <div>
            <h2 className="font-semibold">当前成员</h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {members.map(({ participant, role }) => (
                <li
                  key={participant.id}
                  className="rounded-lg bg-secondary p-3 text-sm"
                >
                  {participant.name}
                  <span className="float-right text-muted-foreground">
                    {role}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-blue-50 p-4 text-sm">
            <strong>公开联系渠道：</strong>
            {team.contact}
          </div>
        </CardContent>
      </Card>
      {session?.user &&
        team.recruitStatus === "recruiting" &&
        members.length < team.maxSize && (
          <Card>
            <CardHeader>
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
