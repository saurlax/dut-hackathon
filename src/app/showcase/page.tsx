import { Link } from "next-view-transitions";
import { showcase } from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/empty-state";
import { Pager } from "@/components/pager";
import { BackHome } from "@/components/back-home";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Reveal } from "@/components/animation/reveal";
export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const { q = "", page, pageSize } = await searchParams;
  const result = await showcase(q, page, pageSize);
  const items = result.items;
  return (
    <div className="paper-grain">
      <BackHome />
      <PageHeading
        eyebrow="SHOWCASE"
        title="黑客松作品展示"
        description="浏览审核通过并同意公开展示的项目。"
      />
      <SearchBar defaultValue={q} placeholder="搜索作品名称" />
      {items.length ? (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="eyebrow">RESULTS</span>
            <span className="nums text-xs text-muted-foreground">
              {String(result.total).padStart(2, "0")} PROJECTS
            </span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-primary/15 bg-primary/15 shadow-sm md:grid-cols-2 lg:grid-cols-3">
            {items.map(({ submission, teamName }, index) => (
              <Reveal
                key={submission.id}
                className="h-full"
                delay={Math.min(index * 0.04, 0.2)}
              >
                <Link
                  href={`/showcase/${submission.id}`}
                  className="group flex h-full"
                >
                  <Card className="relative h-full rounded-none border-0 bg-white/90 shadow-none transition hover:bg-secondary/45">
                    <span className="brand-gradient absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 transition-transform duration-200 group-hover:scale-x-100" />
                    <CardHeader>
                      <Badge variant="outline" className="w-fit">
                        {submission.track}
                      </Badge>
                      <CardTitle className="mt-2 font-display text-xl font-bold">
                        {submission.projectName}
                      </CardTitle>
                      <p className="label-mono text-[10px] text-muted-foreground">
                        {teamName}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <p className="line-clamp-3 text-sm">
                        {submission.oneLiner}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              </Reveal>
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="暂无公开作品"
          description="作品审核通过后将在这里展示。"
        />
      )}
      <Pager
        basePath="/showcase"
        searchParams={{ q, pageSize: String(result.pageSize) }}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </div>
  );
}
