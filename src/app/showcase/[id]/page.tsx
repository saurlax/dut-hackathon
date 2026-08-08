import { Link } from "next-view-transitions";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { publicSubmissionDetail } from "@/lib/queries";
import { isSafeHttpUrl } from "@/lib/domain";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/animation/reveal";
export default async function ShowcaseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = await publicSubmissionDetail(id);
  if (!row) notFound();
  const { submission: s } = row;
  const sections = [
    ["项目背景", s.background],
    ["解决的问题", s.problemSolved],
    ["核心功能", s.coreFeatures],
    ["技术方案", s.techApproach],
    ["创新点", s.innovation],
    ["应用价值", s.applicationValue],
    ["使用说明", s.usageGuide],
  ];
  return (
    <article className="mx-auto max-w-4xl">
      <Link
        href="/showcase"
        className="label-mono mb-8 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="size-3.5" />
        返回作品展示
      </Link>
      <Reveal className="border-b border-primary/15 pb-8" y={16}>
        <Badge variant="outline">{s.track}</Badge>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight md:text-5xl">
          {s.projectName}
        </h1>
        <p className="label-mono mt-3 text-[11px] text-muted-foreground">
          {row.teamName}
        </p>
      </Reveal>
      <Reveal
        className="tech-frame my-8 bg-white/35 px-6 py-10 font-display text-xl font-semibold leading-relaxed md:text-2xl"
        delay={0.08}
      >
        {s.oneLiner}
      </Reveal>
      <Reveal className="grid gap-5 md:grid-cols-2" delay={0.1}>
        {sections.map(([title, text]) => (
          <section
            key={title}
            className="rounded-xl border border-border bg-white/75 p-5 shadow-sm"
          >
            <h2 className="font-display text-lg font-semibold">{title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
              {text}
            </p>
          </section>
        ))}
      </Reveal>
      <Reveal className="mt-10 flex flex-wrap gap-2" delay={0.12}>
        {Object.entries(s.links)
          .filter(([, url]) => isSafeHttpUrl(url))
          .map(([label, url]) => (
            <Button key={label} variant="outline" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                {label}
                <ExternalLink />
              </a>
            </Button>
          ))}
      </Reveal>
    </article>
  );
}
