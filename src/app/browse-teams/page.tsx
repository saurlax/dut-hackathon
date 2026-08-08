import { Link } from "next-view-transitions";
import { ArrowRight, CalendarDays } from "lucide-react";
import { publicTeams } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { cn } from "@/lib/utils";
import { PageHeading } from "@/components/page-heading";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/empty-state";
import { Pager } from "@/components/pager";
import { BackHome } from "@/components/back-home";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/animation/reveal";

export default async function TeamsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const { q = "", page, pageSize } = await searchParams;
  const result = await publicTeams(q, page, pageSize);
  const items = result.items;
  return (
    <>
      <BackHome />
      <PageHeading
        eyebrow="TEAM HALL"
        title="寻找正在招募的队伍"
        description="从项目方向、角色需求和技术栈中找到适合你的队伍。"
      />
      <SearchBar defaultValue={q} placeholder="搜索队名或项目方向" />
      {/* ── Section banner (always shown, even at 0 recruiting) ────── */}
      <header className="mb-6 border-b border-foreground pb-3">
        <div className="flex items-center gap-3">
          <span className="label-mono text-[11px] text-muted-foreground">
            {"// TEAMS"}
          </span>
          <span className="h-px flex-1 bg-foreground/20" />
          <span className="inline-flex items-center gap-1.5 border border-primary bg-primary/10 px-2 py-0.5">
            <span className="h-1.5 w-1.5 bg-primary" />
            <span className="label-mono text-[10px] text-primary">
              {String(result.total).padStart(2, "0")} RECRUITING
            </span>
          </span>
        </div>
      </header>
      {items.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ team, leaderName, currentSize }, index) => {
            const maxSize = team.maxSize;
            const isFull = currentSize >= maxSize;
            const ratio = maxSize > 0 ? Math.min(currentSize / maxSize, 1) : 0;
            const remaining = Math.max(maxSize - currentSize, 0);
            const summary = team.projectDirection || team.description;
            return (
              <Reveal
                key={team.id}
                className="h-full"
                delay={Math.min(index * 0.04, 0.2)}
              >
                <Card className="flex h-full flex-col rounded-none border-foreground/15 bg-white p-5 shadow-none transition-all duration-150 hover:border-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard">
                  {/* top row: team number + recruiting tag */}
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="label-mono nums text-[11px] text-muted-foreground">
                      {displayNumber("T", team.teamNumber)}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5",
                        isFull
                          ? "border border-foreground/30 bg-foreground/5"
                          : "border border-primary bg-primary",
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5",
                          isFull
                            ? "bg-muted-foreground"
                            : "bg-primary-foreground",
                        )}
                      />
                      <span
                        className={cn(
                          "label-mono text-[10px]",
                          isFull
                            ? "text-muted-foreground"
                            : "text-primary-foreground",
                        )}
                      >
                        {isFull ? "已满员" : "招募中"}
                      </span>
                    </span>
                  </div>

                  {/* title + leader */}
                  <h3 className="font-display text-lg font-bold leading-snug tracking-tight text-foreground">
                    {team.name}
                  </h3>
                  <p className="mt-1 label-mono text-[10px] text-muted-foreground">
                    队长 · {leaderName ?? "未公开"}
                  </p>

                  {/* summary */}
                  <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-foreground/75">
                    {summary ? (
                      summary
                    ) : (
                      <span className="italic text-foreground/35">
                        队长还没有写队伍介绍
                      </span>
                    )}
                  </p>

                  {/* required roles — solid reverse chips */}
                  {team.requiredRoles.length > 0 && (
                    <div className="mt-3">
                      <p className="label-mono mb-1.5 text-[10px] text-muted-foreground">
                        正在招募
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {team.requiredRoles.slice(0, 5).map((role) => (
                          <span
                            key={role}
                            className="label-mono bg-foreground px-1.5 py-0.5 text-[10px] text-background"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* stack — neutral mono, slash-separated */}
                  {team.techStack.length > 0 && (
                    <div className="mt-2.5 font-mono text-[10px] text-muted-foreground">
                      <span className="label-mono mr-1.5 text-foreground/40">
                        STACK
                      </span>
                      {team.techStack.slice(0, 4).map((tech, i) => (
                        <span key={tech}>
                          {i > 0 && (
                            <span className="mx-1 text-foreground/20">/</span>
                          )}
                          {tech}
                        </span>
                      ))}
                      {team.techStack.length > 4 && (
                        <span className="ml-1 text-foreground/40">
                          +{team.techStack.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* membership scope tag */}
                  <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                    <span className="border border-foreground/20 px-1.5 py-0.5 text-muted-foreground">
                      {team.allowExternal ? "接受校外成员" : "仅限校内成员"}
                    </span>
                  </div>

                  {/* capacity bar + meta, pinned to the card bottom */}
                  <div className="mt-auto">
                    <div className="mt-4 border-t border-foreground/15 pt-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="font-bold text-foreground">
                          当前 {currentSize} 人
                        </span>
                        <span className="text-muted-foreground">
                          还可招募 {remaining} 人
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-foreground/10">
                        <div
                          className={cn(
                            "h-full",
                            isFull ? "bg-foreground" : "bg-primary",
                          )}
                          style={{ width: `${ratio * 100}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1 label-mono text-[10px] text-muted-foreground">
                        <CalendarDays className="size-3" />
                        {team.recruitmentDeadline}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="rounded-sm"
                      >
                        <Link href={`/team/${team.id}`}>
                          查看详情
                          <ArrowRight />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </Card>
              </Reveal>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="暂无匹配队伍"
          description="换个关键词试试，或创建第一支队伍。"
        />
      )}
      <Pager
        basePath="/browse-teams"
        searchParams={{ q, pageSize: String(result.pageSize) }}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </>
  );
}
