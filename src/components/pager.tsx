import { Link } from "next-view-transitions";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/animation/reveal";

/**
 * Server-rendered pager driven by `?page=` in the URL. Renders nothing when
 * there is only a single page. Other search params (e.g. `q`) are preserved
 * when navigating between pages.
 */
export function Pager({
  basePath,
  searchParams,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  searchParams: Record<string, string | undefined>;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams))
      if (value) params.set(key, value);
    params.set("page", String(target));
    return `${basePath}?${params.toString()}`;
  };

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <Reveal>
      <nav
        className="mt-10 flex items-center justify-center gap-5 text-sm"
        aria-label="分页导航"
      >
        {prevDisabled ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground/40">
            <ChevronLeft className="size-4" /> 上一页
          </span>
        ) : (
          <Link
            href={href(page - 1)}
            rel="prev"
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> 上一页
          </Link>
        )}
        <span className="nums text-xs text-muted-foreground">
          第 {page} / {totalPages} 页 · 共 {total} 条
        </span>
        {nextDisabled ? (
          <span className="inline-flex items-center gap-1 text-muted-foreground/40">
            下一页 <ChevronRight className="size-4" />
          </span>
        ) : (
          <Link
            href={href(page + 1)}
            rel="next"
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            下一页 <ChevronRight className="size-4" />
          </Link>
        )}
      </nav>
    </Reveal>
  );
}
