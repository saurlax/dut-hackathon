import Link from "next/link";
import { requireUser } from "@/lib/authz";
import { participantForUser } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { PageHeading } from "@/components/page-heading";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const auditLabels = {
  pending: "等待审核",
  approved: "审核通过",
  rejected: "审核未通过",
} as const;

export default async function MyRegistration() {
  const user = await requireUser("/my-registration");
  const p = await participantForUser(user.id);
  if (!p)
    return (
      <>
        <PageHeading
          eyebrow="PROFILE"
          title="我的报名"
          description="查看参赛报名状态与资料。"
        />
        <EmptyState
          title="尚未报名"
          description="完成报名后，资料会显示在这里。"
        />
        <Button className="mt-4" asChild>
          <Link href="/register">填写报名资料</Link>
        </Button>
      </>
    );
  const fields = [
    ["姓名", p.name],
    ["邮箱", p.email],
    ["学校", `${p.school} · ${p.college}`],
    ["年级", p.grade],
    ["报名方式", p.registrationMethod],
    ["公开联系方式", p.publicContact || "未公开"],
  ];
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeading
        eyebrow={displayNumber("P", p.participantNumber)}
        title="我的报名"
        description="资料审核状态和公开设置一目了然。"
      />
      <Card className="border-primary/15 bg-primary/15">
        <CardContent className="grid gap-px overflow-hidden p-0 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label} className="bg-white/90 p-5">
              <p className="label-mono text-[10px] text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 font-medium">{value}</p>
            </div>
          ))}
        </CardContent>
      </Card>
      <div className="mt-5 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="border-primary/25 bg-primary/10 text-primary"
        >
          {auditLabels[p.auditStatus]}
        </Badge>
        <Badge variant="outline">
          {p.publicDisplay ? "公开展示" : "未公开"}
        </Badge>
      </div>
      {p.auditStatus === "rejected" && p.adminNote && (
        <div className="mt-5 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          <span className="font-semibold">驳回原因：</span>
          {p.adminNote}
        </div>
      )}
      <Button className="mt-6" asChild>
        <Link href="/register">编辑资料</Link>
      </Button>
    </div>
  );
}
