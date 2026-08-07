import { publicParticipants } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { PageHeading } from "@/components/page-heading";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function PoolPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const items = await publicParticipants(q);
  return (
    <>
      <PageHeading
        eyebrow="TALENT POOL"
        title="发现想加入项目的伙伴"
        description="公开资料均由参赛者授权展示；联系时请尊重对方隐私。"
      />
      <SearchBar defaultValue={q} placeholder="搜索姓名或个人简介" />
      {items.length ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">RESULTS</span>
            <span className="nums text-xs text-muted-foreground">
              {String(items.length).padStart(2, "0")} PEOPLE
            </span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-primary/15 bg-primary/15 shadow-sm md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card
                key={item.id}
                className="rounded-none border-0 bg-white/90 shadow-none hover:bg-secondary/45"
              >
                <CardHeader>
                  <Badge variant="outline" className="nums w-fit">
                    {displayNumber("P", item.participantNumber)}
                  </Badge>
                  <CardTitle className="mt-2 font-display text-xl font-bold">
                    {item.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {item.school} · {item.college} · {item.grade}
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 min-h-14 text-sm">
                    {item.bio || "这位参赛者暂未填写简介。"}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1">
                    {[...item.desiredRoles, ...item.techStack]
                      .slice(0, 5)
                      .map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                  </div>
                  <p className="mt-5 rounded-lg border border-primary/15 bg-secondary/70 p-3 text-sm">
                    <span className="label-mono mr-1 text-[10px] text-primary">
                      CONTACT
                    </span>
                    {item.publicContact}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="暂无公开资料"
          description="换个关键词，或稍后再来看看。"
        />
      )}
    </>
  );
}
