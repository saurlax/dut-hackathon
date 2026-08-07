import { requireAdmin } from "@/lib/authz";
import { adminOverview } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { AdminAuditQueue } from "@/components/admin-audit-queue";
import { AdminAuditButtons } from "@/components/admin-audit-buttons";
import { AdminDetailDialog } from "@/components/admin-detail-dialog";
import {
  ParticipantRecordDetails,
  TeamRecordDetails,
} from "@/components/admin-record-details";
import { AdminUserForm } from "@/components/admin-user-form";
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
    ["管理员", data.admins.length],
  ];
  return (
    <>
      <PageHeading
        eyebrow="ADMIN CONSOLE"
        title="赛事管理后台"
        description="审核报名、队伍、最终确认与作品材料。所有写操作均经过服务端角色校验。"
      />
      <section className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-primary/15 bg-primary/15 md:grid-cols-5">
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
          <TabsTrigger value="admins">管理员</TabsTrigger>
        </TabsList>
        <TabsContent value="participants">
          <AdminAuditQueue
            title="参赛者审核"
            headers={["编号", "姓名", "学校", "状态", "操作"]}
            allLabel="全部参赛者"
            records={data.participants.map((p) => ({
              key: p.id,
              status: p.auditStatus,
              cells: [
                p.number,
                p.name,
                p.school,
                <AuditStatusBadge key="s" status={p.auditStatus} />,
                <div key="a" className="flex flex-wrap items-center gap-2">
                  <AdminDetailDialog
                    title={`${p.number} · ${p.name}`}
                    description="查看完整报名资料后再执行审核。"
                  >
                    <ParticipantRecordDetails participant={p} />
                  </AdminDetailDialog>
                  <AdminAuditButtons kind="participant" id={p.id} />
                </div>,
              ],
            }))}
          />
        </TabsContent>
        <TabsContent value="teams">
          <AdminAuditQueue
            title="队伍审核"
            headers={["编号", "队名", "方向", "状态", "操作"]}
            allLabel="全部队伍"
            records={data.teams.map((t) => ({
              key: t.id,
              status: t.auditStatus,
              cells: [
                t.number,
                t.name,
                t.projectDirection || "-",
                <AuditStatusBadge key="s" status={t.auditStatus} />,
                <div key="a" className="flex flex-wrap items-center gap-2">
                  <AdminDetailDialog
                    title={`${t.number} · ${t.name}`}
                    description="查看队伍资料、公开设置和成员确认情况后再执行审核。"
                  >
                    <TeamRecordDetails team={t} />
                  </AdminDetailDialog>
                  <AdminAuditButtons kind="team" id={t.id} />
                </div>,
              ],
            }))}
          />
        </TabsContent>
        <TabsContent value="confirmations">
          <AdminAuditQueue
            title="最终确认审核"
            headers={["编号", "队伍 ID", "状态", "操作"]}
            allLabel="全部最终确认"
            records={data.confirmations.map((c) => ({
              key: c.id,
              status: c.auditStatus,
              cells: [
                displayNumber("C", c.confirmationNumber),
                c.teamId,
                <AuditStatusBadge key="s" status={c.auditStatus} />,
                <AdminAuditButtons key="a" kind="confirmation" id={c.id} />,
              ],
            }))}
          />
        </TabsContent>
        <TabsContent value="submissions">
          <AdminAuditQueue
            title="作品审核"
            headers={["编号", "作品", "材料", "状态", "操作"]}
            allLabel="全部作品"
            records={data.submissions.map((s) => ({
              key: s.id,
              status: s.auditStatus,
              cells: [
                displayNumber("S", s.submissionNumber),
                s.projectName,
                s.materialStatus,
                <AuditStatusBadge key="s" status={s.auditStatus} />,
                <AdminAuditButtons key="a" kind="submission" id={s.id} />,
              ],
            }))}
          />
        </TabsContent>
        <TabsContent value="admins">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <Card className="border-primary/15">
              <CardHeader>
                <p className="eyebrow text-primary">ADMIN ACCESS</p>
                <CardTitle>新增管理员</CardTitle>
                <p className="text-sm text-muted-foreground">
                  只有当前管理员可以授予管理员权限。
                </p>
              </CardHeader>
              <CardContent>
                <AdminUserForm />
              </CardContent>
            </Card>
            <Card className="overflow-hidden border-primary/15">
              <CardHeader>
                <p className="eyebrow text-primary">ADMIN USERS</p>
                <CardTitle>管理员列表</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>邮箱</TableHead>
                        <TableHead>姓名</TableHead>
                        <TableHead>邮箱状态</TableHead>
                        <TableHead>创建时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.admins.map((admin) => (
                        <TableRow key={admin.id}>
                          <TableCell className="font-medium">
                            {admin.email}
                          </TableCell>
                          <TableCell>{admin.name || "未填写"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {admin.emailVerified ? "已验证" : "待首次登录"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {formatDateTime(admin.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

function AuditStatusBadge({
  status,
}: {
  status: "pending" | "approved" | "rejected";
}) {
  const labels = {
    pending: "待审核",
    approved: "已通过",
    rejected: "已驳回",
  } as const;
  return <Badge variant="outline">{labels[status]}</Badge>;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Shanghai",
  }).format(value);
}
