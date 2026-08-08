import { requireAdmin } from "@/lib/authz";
import { adminEmails } from "@/lib/env";
import { adminOverview, announcementSettings } from "@/lib/queries";
import { displayNumber } from "@/lib/domain";
import { AdminAuditQueue } from "@/components/admin-audit-queue";
import { AdminAuditButtons } from "@/components/admin-audit-buttons";
import { AdminDetailDialog } from "@/components/admin-detail-dialog";
import {
  ConfirmationRecordDetails,
  ParticipantRecordDetails,
  SubmissionRecordDetails,
  TeamRecordDetails,
} from "@/components/admin-record-details";
import { AdminUserForm } from "@/components/admin-user-form";
import { AdminAnnouncementForm } from "@/components/admin-announcement-form";
import { RemoveAdminButton } from "@/components/remove-admin-button";
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
  const me = await requireAdmin();
  const [data, announcement] = await Promise.all([
    adminOverview(),
    announcementSettings(),
  ]);
  const seeds = adminEmails();
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
        description="报名与队伍资料提交后立即公开，管理员可随时巡查并下架违规内容；最终确认与作品仍需要逐条审核。所有写操作均经过服务端角色校验。"
      />
      <section className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-5">
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
          <TabsTrigger value="announcement">公告</TabsTrigger>
          <TabsTrigger value="admins">管理员</TabsTrigger>
        </TabsList>
        <TabsContent value="participants">
          <AdminAuditQueue
            title="参赛者资料巡查"
            headers={["编号", "姓名", "学校", "状态", "操作"]}
            allLabel="全部参赛者"
            defaultFilter="all"
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
                    description="报名资料已自动公开；仅在下架或恢复时操作。"
                  >
                    <ParticipantRecordDetails participant={p} />
                  </AdminDetailDialog>
                  <AdminAuditButtons
                    kind="participant"
                    id={p.id}
                    status={p.auditStatus}
                    revision={p.revision}
                  />
                </div>,
              ],
            }))}
          />
        </TabsContent>
        <TabsContent value="teams">
          <AdminAuditQueue
            title="队伍资料巡查"
            headers={["编号", "队名", "方向", "状态", "操作"]}
            allLabel="全部队伍"
            defaultFilter="all"
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
                    description="队伍资料已自动公开；仅在下架或恢复时操作。"
                  >
                    <TeamRecordDetails team={t} />
                  </AdminDetailDialog>
                  <AdminAuditButtons
                    kind="team"
                    id={t.id}
                    status={t.auditStatus}
                    revision={t.revision}
                  />
                </div>,
              ],
            }))}
          />
        </TabsContent>
        <TabsContent value="confirmations">
          <AdminAuditQueue
            title="最终确认审核"
            headers={["编号", "队伍 ID", "队名", "状态", "操作"]}
            allLabel="全部最终确认"
            records={data.confirmations.map((c) => ({
              key: c.id,
              status: c.auditStatus,
              cells: [
                c.number,
                c.teamNumber,
                c.teamName,
                <AuditStatusBadge key="s" status={c.auditStatus} />,
                <div key="a" className="flex flex-wrap items-center gap-2">
                  <AdminDetailDialog
                    title={`${c.number} · ${c.teamNumber}`}
                    description="查看成员快照后再执行审核。"
                  >
                    <ConfirmationRecordDetails confirmation={c} />
                  </AdminDetailDialog>
                  <AdminAuditButtons
                    kind="confirmation"
                    id={c.id}
                    status={c.auditStatus}
                    revision={c.revision}
                  />
                </div>,
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
                <MaterialStatusBadge key="m" status={s.materialStatus} />,
                <AuditStatusBadge key="s" status={s.auditStatus} />,
                <div key="a" className="flex flex-wrap items-center gap-2">
                  <AdminDetailDialog
                    title={`${displayNumber("S", s.submissionNumber)} · ${s.projectName}`}
                    description="查看作品说明和材料链接后再执行审核。"
                  >
                    <SubmissionRecordDetails submission={s} />
                  </AdminDetailDialog>
                  <AdminAuditButtons
                    kind="submission"
                    id={s.id}
                    status={s.auditStatus}
                    revision={s.revision}
                  />
                </div>,
              ],
            }))}
          />
        </TabsContent>
        <TabsContent value="announcement">
          <AdminAnnouncementForm
            initialValue={{
              title: announcement?.title ?? "",
              content: announcement?.content ?? "",
              enabled: announcement?.enabled ?? false,
              updatedAtLabel: announcement
                ? `上次保存：${formatDateTime(announcement.updatedAt)}`
                : "尚未保存公告",
            }}
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
                        <TableHead>操作</TableHead>
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
                          <TableCell>
                            <RemoveAdminButton
                              email={admin.email}
                              disabled={
                                me.email?.toLowerCase() ===
                                  admin.email.toLowerCase() ||
                                seeds.has(admin.email.toLowerCase())
                              }
                            />
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
  const className =
    status === "approved"
      ? "border-success/25 bg-success/10 text-success"
      : status === "rejected"
        ? "border-destructive/25 bg-destructive/10 text-destructive"
        : "border-warning/25 bg-warning/10 text-warning";
  return (
    <Badge variant="outline" className={className}>
      {labels[status]}
    </Badge>
  );
}

function MaterialStatusBadge({
  status,
}: {
  status: "pending" | "complete" | "incomplete";
}) {
  const labels = {
    pending: "待检查",
    complete: "完整",
    incomplete: "不完整",
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
