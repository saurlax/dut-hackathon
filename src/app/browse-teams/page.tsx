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
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">RESULTS</span>
            <span className="nums text-xs text-muted-foreground">
              {String(items.length).padStart(2, "0")} TEAMS
            </span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-primary/15 bg-primary/15 shadow-sm md:grid-cols-2 lg:grid-cols-3">
            {items.map(({ team, leaderName, currentSize }) => (
              <Card
                key={team.id}
                className="group rounded-none border-0 bg-white/90 shadow-none transition hover:bg-secondary/45"
              >
                <CardHeader>
                  <div className="flex justify-between">
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
                      {team.recruitStatus === "recruiting"
                        ? "招募中"
                        : "已暂停"}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3 font-display text-xl font-bold">
                    {team.name}
                  </CardTitle>
                  <p className="label-mono text-[10px] text-muted-foreground">
                    队长 · {leaderName}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-2 min-h-10 text-sm">
                    {team.projectDirection || team.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {team.techStack.slice(0, 4).map((tag) => (
                      <Badge key={tag} variant="outline">
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
                  <Button
                    className="mt-5 w-full group-hover:border-primary/35"
                    variant="outline"
                    asChild
                  >
                    <Link href={`/team/${team.id}`}>
                      查看详情
                      <ArrowRight />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="暂无匹配队伍"
          description="换个关键词试试，或创建第一支队伍。"
        />
      )}
    </>
  );
}
