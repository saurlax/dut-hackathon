import Link from "next/link";
import { showcase } from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/empty-state";
import { BackHome } from "@/components/back-home";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
export default async function ShowcasePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const items = await showcase(q);
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
              {String(items.length).padStart(2, "0")} PROJECTS
            </span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-primary/15 bg-primary/15 shadow-sm md:grid-cols-2 lg:grid-cols-3">
            {items.map(({ submission, teamName }) => (
              <Link
                href={`/showcase/${submission.id}`}
                key={submission.id}
                className="group"
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
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title="暂无公开作品"
          description="作品审核通过后将在这里展示。"
        />
      )}
    </div>
  );
}
