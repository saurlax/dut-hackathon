import Link from "next/link";
import { ArrowRight, CalendarDays, Users } from "lucide-react";
import { publicTeams } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { PageHeading } from "@/components/page-heading";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const items = await publicTeams(q);
  return (
    <>
      <PageHeading
        eyebrow="TEAM HALL"
        title="寻找正在招募的队伍"
        description="从项目方向、角色需求和技术栈中找到适合你的队伍。"
      />
      <SearchBar defaultValue={q} placeholder="搜索队名或项目方向" />
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ team, leaderName, currentSize }) => (
            <Card
              key={team.id}
              className="bg-white/75 transition hover:-translate-y-1 hover:shadow-lg"
            >
              <CardHeader>
                <div className="flex justify-between">
                  <Badge variant="outline">
                    {displayNumber("T", team.teamNumber)}
                  </Badge>
                  <Badge>
                    {team.recruitStatus === "recruiting" ? "招募中" : "已暂停"}
                  </Badge>
                </div>
                <CardTitle className="mt-3">{team.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  队长 · {leaderName}
                </p>
              </CardHeader>
              <CardContent>
                <p className="line-clamp-2 min-h-10 text-sm">
                  {team.projectDirection || team.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-1">
                  {team.techStack.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" />
                    {currentSize}/{team.maxSize}
                  </span>
                  <span className="flex items-center gap-1">
                    <CalendarDays className="size-3.5" />
                    {team.recruitmentDeadline}
                  </span>
                </div>
                <Button className="mt-5 w-full" variant="outline" asChild>
                  <Link href={`/team/${team.id}`}>
                    查看详情
                    <ArrowRight />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="暂无匹配队伍"
          description="换个关键词试试，或创建第一支队伍。"
        />
      )}
    </>
  );
}
