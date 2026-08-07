import { requireAdmin } from "@/lib/authz";
import { adminOverview } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { AdminAuditButtons } from "@/components/admin-audit-buttons";
import { AdminDetailDialog } from "@/components/admin-detail-dialog";
import {
  ParticipantRecordDetails,
  TeamRecordDetails,
} from "@/components/admin-record-details";
import { PageHeading } from "@/components/page-heading";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
export default async function AdminPage() {
  await requireAdmin();
  const data = await adminOverview();
  const stat = [
    ["参赛者", data.participants.length],
    ["队伍", data.teams.length],
    ["最终确认", data.confirmations.length],
    ["作品", data.submissions.length],
  ];
  return (
    <>
      <PageHeading
        eyebrow="ADMIN CONSOLE"
        title="赛事管理后台"
        description="审核报名、队伍、最终确认与作品材料。所有写操作均经过服务端角色校验。"
      />
      <section className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-primary/15 bg-primary/15 md:grid-cols-4">
        {stat.map(([label, value]) => (
          <Card key={label} className="rounded-none border-0 shadow-none">
            <CardContent className="p-5">
              <p className="label-mono text-[10px] text-muted-foreground">
                {label}
              </p>
              <p className="nums mt-2 text-3xl font-bold">{value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <Tabs defaultValue="participants">
        <TabsList className="mb-5 flex h-auto flex-wrap border border-primary/15 bg-white/65 p-1 shadow-xs">
          <TabsTrigger value="participants">参赛者</TabsTrigger>
          <TabsTrigger value="teams">队伍</TabsTrigger>
          <TabsTrigger value="confirmations">最终确认</TabsTrigger>
          <TabsTrigger value="submissions">作品</TabsTrigger>
        </TabsList>
        <TabsContent value="participants">
          <AdminTable
            title="参赛者审核"
            headers={["编号", "姓名", "学校", "状态", "操作"]}
            rows={data.participants.map((p) => [
              p.number,
              p.name,
              p.school,
              <Badge key="s" variant="outline">
                {p.auditStatus}
              </Badge>,
              <div key="a" className="flex flex-wrap items-center gap-2">
                <AdminDetailDialog
                  title={`${p.number} · ${p.name}`}
                  description="查看完整报名资料后再执行审核。"
                >
                  <ParticipantRecordDetails participant={p} />
                </AdminDetailDialog>
                <AdminAuditButtons kind="participant" id={p.id} />
              </div>,
            ])}
          />
        </TabsContent>
        <TabsContent value="teams">
          <AdminTable
            title="队伍审核"
            headers={["编号", "队名", "方向", "状态", "操作"]}
            rows={data.teams.map((t) => [
              t.number,
              t.name,
              t.projectDirection || "-",
              <Badge key="s" variant="outline">
                {t.auditStatus}
              </Badge>,
              <div key="a" className="flex flex-wrap items-center gap-2">
                <AdminDetailDialog
                  title={`${t.number} · ${t.name}`}
                  description="查看队伍资料、公开设置和成员确认情况后再执行审核。"
                >
                  <TeamRecordDetails team={t} />
                </AdminDetailDialog>
                <AdminAuditButtons kind="team" id={t.id} />
              </div>,
            ])}
          />
        </TabsContent>
        <TabsContent value="confirmations">
          <AdminTable
            title="最终确认审核"
            headers={["编号", "队伍 ID", "状态", "操作"]}
            rows={data.confirmations.map((c) => [
              displayNumber("C", c.confirmationNumber),
              c.teamId,
              <Badge key="s" variant="outline">
                {c.auditStatus}
              </Badge>,
              <AdminAuditButtons key="a" kind="confirmation" id={c.id} />,
            ])}
          />
        </TabsContent>
        <TabsContent value="submissions">
          <AdminTable
            title="作品审核"
            headers={["编号", "作品", "材料", "状态", "操作"]}
            rows={data.submissions.map((s) => [
              displayNumber("S", s.submissionNumber),
              s.projectName,
              s.materialStatus,
              <Badge key="s" variant="outline">
                {s.auditStatus}
              </Badge>,
              <AdminAuditButtons key="a" kind="submission" id={s.id} />,
            ])}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}
function AdminTable({
  title,
  headers,
  rows,
}: {
  title: string;
  headers: string[];
  rows: React.ReactNode[][];
}) {
  return (
    <Card className="overflow-hidden border-primary/15">
      <CardHeader>
        <p className="eyebrow text-primary">AUDIT QUEUE</p>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((h) => (
                  <TableHead key={h} className="label-mono text-[10px]">
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => (
                <TableRow key={i}>
                  {row.map((cell, j) => (
                    <TableCell key={j}>{cell}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
