import { publicParticipants } from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/empty-state";
import { Pager } from "@/components/pager";
import { BackHome } from "@/components/back-home";
import { PublicParticipantCard } from "@/components/public-participant-card";
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
        description="公开资料由参赛者授权后立即展示；点击卡片可查看完整公开资料，联系时请尊重对方隐私。"
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
          {items.map((item, index) => (
            <Reveal
              key={item.id}
              className="h-full"
              delay={Math.min(index * 0.04, 0.2)}
            >
              <PublicParticipantCard participant={item} />
            </Reveal>
          ))}
        </div>
      ) : (
        <EmptyState
          title="暂无公开资料"
          description="换个关键词，或稍后再来看看。"
        />
      )}
      <Pager
        basePath="/browse-pool"
        searchParams={{ q, pageSize: String(result.pageSize) }}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </>
  );
}
