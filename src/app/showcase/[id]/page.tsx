import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { submissions, teams } from "@/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
export default async function ShowcaseDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const row = (
    await db
      .select({ submission: submissions, teamName: teams.name })
      .from(submissions)
      .innerJoin(teams, eq(submissions.teamId, teams.id))
      .where(eq(submissions.id, id))
      .limit(1)
  )[0];
  if (
    !row ||
    row.submission.auditStatus !== "approved" ||
    !row.submission.publicDisplay
  )
    notFound();
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
    <article className="mx-auto max-w-3xl">
      <Badge>{s.track}</Badge>
      <h1 className="mt-4 text-4xl font-black">{s.projectName}</h1>
      <p className="mt-2 text-muted-foreground">{row.teamName}</p>
      <p className="tech-frame my-8 rounded-2xl p-6 text-lg font-medium">
        {s.oneLiner}
      </p>
      <div className="space-y-8">
        {sections.map(([title, text]) => (
          <section key={title}>
            <h2 className="text-xl font-bold">{title}</h2>
            <p className="mt-2 whitespace-pre-wrap leading-7 text-muted-foreground">
              {text}
            </p>
          </section>
        ))}
      </div>
      <div className="mt-10 flex flex-wrap gap-2">
        {Object.entries(s.links)
          .filter(([, url]) => url)
          .map(([label, url]) => (
            <Button key={label} variant="outline" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                {label}
              </a>
            </Button>
          ))}
      </div>
    </article>
  );
}
