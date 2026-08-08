import { publicParticipants } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { PageHeading } from "@/components/page-heading";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/empty-state";
import { Pager } from "@/components/pager";
import { BackHome } from "@/components/back-home";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/animation/reveal";

export default async function PoolPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const { q = "", page, pageSize } = await searchParams;
  const result = await publicParticipants(q, page, pageSize);
  const items = result.items;
  return (
    <>
      <BackHome />
      <PageHeading
        eyebrow="TALENT POOL"
        title="发现想加入项目的伙伴"
        description="公开资料由参赛者授权后立即展示；管理员会不定期巡查，联系时请尊重对方隐私。"
      />
      <SearchBar defaultValue={q} placeholder="搜索姓名或个人简介" />
      {/* ── Section banner (always shown, even at 0 people) ───────── */}
      <header className="mb-6 border-b border-foreground pb-3">
        <div className="flex items-center gap-3">
          <span className="label-mono text-[11px] text-muted-foreground">
            {"// POOL"}
          </span>
          <span className="h-px flex-1 bg-foreground/20" />
          <span className="inline-flex items-center gap-1.5 border border-foreground/30 bg-foreground/5 px-2 py-0.5">
            <span className="h-1.5 w-1.5 bg-foreground" />
            <span className="label-mono text-[10px] text-foreground">
              {String(result.total).padStart(2, "0")} PEOPLE
            </span>
          </span>
        </div>
      </header>
      {items.length ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => {
            const stack = item.techStack;
            const profile = [item.school, item.college, item.grade].filter(
              Boolean,
            );
            return (
              <Reveal
                key={item.id}
                className="h-full"
                delay={Math.min(index * 0.04, 0.2)}
              >
                <Card className="flex h-full flex-col rounded-none border-foreground/15 bg-white p-5 shadow-none transition-all duration-150 hover:border-foreground hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-hard">
                  {/* name + participant number */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-bold tracking-tight text-foreground">
                        {item.name}
                      </h3>
                      <p className="mt-0.5 label-mono nums text-[10px] text-muted-foreground">
                        {displayNumber("P", item.participantNumber)}
                      </p>
                    </div>
                  </div>

                  {profile.length > 0 && (
                    <p className="mt-1 label-mono text-[10px] text-muted-foreground">
                      {profile.join(" · ")}
                    </p>
                  )}

                  {/* desired roles — solid reverse chips */}
                  {item.desiredRoles.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {item.desiredRoles.map((role) => (
                        <span
                          key={role}
                          className="label-mono bg-foreground px-1.5 py-0.5 text-[10px] text-background"
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* stack — neutral mono, slash-separated */}
                  {stack.length > 0 && (
                    <div className="mt-2.5 font-mono text-[10px] text-muted-foreground">
                      <span className="label-mono mr-1.5 text-foreground/40">
                        STACK
                      </span>
                      {stack.slice(0, 4).map((tech, i) => (
                        <span key={tech}>
                          {i > 0 && (
                            <span className="mx-1 text-foreground/20">/</span>
                          )}
                          {tech}
                        </span>
                      ))}
                      {stack.length > 4 && (
                        <span className="ml-1 text-foreground/40">
                          +{stack.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  {/* bio */}
                  <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-muted-foreground">
                    {item.bio ? (
                      item.bio
                    ) : (
                      <span className="italic text-foreground/35">
                        这位参赛者暂未填写简介
                      </span>
                    )}
                  </p>

                  {/* public contact, pinned to the card bottom */}
                  {item.publicContact && (
                    <div className="mt-auto border-t border-foreground/15 pt-3 font-mono text-[11px] text-muted-foreground">
                      <span className="label-mono mr-1.5 text-[10px] text-foreground/40">
                        公开联系方式
                      </span>
                      <span className="break-all">{item.publicContact}</span>
                    </div>
                  )}
                </Card>
              </Reveal>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="暂无公开资料"
          description="换个关键词，或稍后再来看看。"
        />
      )}
      <Pager
        basePath="/browse-pool"
        searchParams={{ q }}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </>
  );
}
