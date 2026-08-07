import Link from "next/link";
import { showcase } from "@/lib/queries";
import { PageHeading } from "@/components/page-heading";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/empty-state";
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
    <>
      <PageHeading
        eyebrow="SHOWCASE"
        title="黑客松作品展示"
        description="浏览审核通过并同意公开展示的项目。"
      />
      <SearchBar defaultValue={q} placeholder="搜索作品名称" />
      {items.length ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map(({ submission, teamName }) => (
            <Link href={`/showcase/${submission.id}`} key={submission.id}>
              <Card className="h-full bg-white/75 transition hover:-translate-y-1 hover:shadow-lg">
                <CardHeader>
                  <Badge className="w-fit">{submission.track}</Badge>
                  <CardTitle className="mt-2">
                    {submission.projectName}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{teamName}</p>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm">{submission.oneLiner}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="暂无公开作品"
          description="作品审核通过后将在这里展示。"
        />
      )}
    </>
  );
}
