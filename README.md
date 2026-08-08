# 大工黑客松组队中心

面向大工黑客松参赛者的全栈组队平台，提供报名资料、公开组队、最终确认、作品提交、作品展示和后台审核等功能。

## 功能

- 邮箱魔法链接登录，无需设置密码
- 参赛者报名资料填写与公开展示
- 队伍创建、编辑、申请审批、成员确认和队长转让
- 入队申请、撤回、批准与拒绝
- 参赛队伍最终确认与成员快照
- 作品提交、公开展示和审核
- 基于角色的管理后台，支持报名/队伍资料巡查、最终确认与作品审核、详情查看、下架/驳回和管理员账户管理
- 桌面端与移动端响应式界面

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Auth.js 5、Nodemailer 邮箱魔法链接
- PostgreSQL 17、Drizzle ORM、Drizzle Kit
- Tailwind CSS 4、shadcn/ui、Radix UI、Lucide
- Motion、next-view-transitions（滚动/局部动画与路由 crossfade）
- React Hook Form、Zod
- Vitest、Testing Library、Playwright

## 本地开发

需要准备 Node.js 22.22.2+、npm 10+ 和 Docker Desktop。也可以自行提供 PostgreSQL 与 SMTP 服务。

```bash
cp .env.example .env.local
docker compose up -d
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Windows PowerShell 请使用以下命令复制环境变量文件：

```powershell
Copy-Item .env.example .env.local
```

启动后可访问：

- 应用：<http://localhost:3000>
- Mailpit 测试邮箱：<http://localhost:8025>

`npm run db:seed` 仅用于写入本地演示数据，可以跳过。

## 环境变量

| 变量                    | 说明                                                                                                      |
| ----------------------- | --------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL 连接字符串                                                                                     |
| `AUTH_SECRET`           | Auth.js 密钥，至少 32 个字符                                                                              |
| `AUTH_URL`              | 应用公开地址，本地默认为 `http://localhost:3000`；未配置时登录会拒绝信任 Host，避免魔法链接被 Host 头污染 |
| `EMAIL_SERVER_HOST`     | SMTP 主机地址                                                                                             |
| `EMAIL_SERVER_PORT`     | SMTP 端口                                                                                                 |
| `EMAIL_SERVER_USER`     | SMTP 用户名                                                                                               |
| `EMAIL_SERVER_PASSWORD` | SMTP 密码                                                                                                 |
| `EMAIL_FROM`            | 登录邮件发件人                                                                                            |
| `ADMIN_EMAILS`          | 逗号分隔的初始管理员邮箱列表                                                                              |
| `TRUST_PROXY`           | 是否信任反向代理的客户端 IP，Zeabur 设为 `true`；取不到 IP 时跳过组合限流，不会阻止登录                   |

生产环境必须使用随机生成的 `AUTH_SECRET` 和真实 SMTP 凭据，并建议将 `TRUST_PROXY` 设为 `true`。未配置或取不到可信客户端 IP 时会跳过组合限流，不会让正常登录被误判为“发送太频繁”。用户完成邮箱验证后即可创建账户；`ADMIN_EMAILS` 中的账户会在登录时提升为管理员。已有管理员还可以在管理后台按邮箱新增管理员，数据库中已授予的管理员角色不会因邮箱不在 `ADMIN_EMAILS` 中而被降级。

## 数据库

数据库结构定义在 `src/db/schema.ts`，SQL migration 保存在 `drizzle/`。`npm run build` 会在 Next.js 构建前自动执行尚未应用的 migration；应用请求和运行时启动不会修改数据库结构。

```bash
npm run db:generate
npm run db:migrate
```

修改 schema 后，应生成并检查 SQL migration，再与代码一同提交。业务数据涉及参赛者、队伍、成员、入队申请、最终确认成员快照和作品提交；认证表与业务表共用同一个 PostgreSQL 数据库。

本次隐私迁移会把历史队伍和作品收口为不公开，并要求历史非队长成员本人确认关系。旧的“校内成员”默认值会清除并重新进入审核，用户需在报名资料中重新声明。

`0005_auto_approve_profiles` 会把历史上仍处于 `pending` 的报名和队伍资料标记为已公开可用，配合“报名/队伍不再逐条审核”的新规则；管理员仍可随时下架违规资料。

Drizzle 会在数据库中记录已执行的 migration，因此重复构建不会重复应用同一版本。构建环境必须预先提供可连接且具有建表权限的 `DATABASE_URL`；migration 不负责创建 PostgreSQL 数据库实例本身。

## 常用命令

```bash
npm run dev
npm run build
npm start
npm run check
npm test
npm run test:integration
npm run test:e2e
```

集成测试需要已完成 migration 的测试数据库，可通过 `TEST_DATABASE_URL` 指定。完整邮箱登录 E2E 需要设置 `E2E_MAILPIT_URL`；未设置时会跳过依赖 Mailpit 的用例。E2E 默认使用 `127.0.0.1:3000`，可通过 `E2E_PORT` 或 `E2E_BASE_URL` 覆盖，便于在已有开发服务器占用端口时并行运行。

跑 E2E 前请将 `EMAIL_SERVER_PORT` 对齐 Mailpit 实际 SMTP 端口；仓库 `compose.yaml` 默认使用 `1025`。

## 业务规则

- 报名与队伍资料在明确同意公开后立即展示；管理员会不定期巡查并下架违规资料。最终确认与作品仍需要审核通过后展示。
- 组队大厅只展示仍在截止日期内且状态为招募中的队伍；暂停招募会保留待处理申请，队长可以直接恢复招募，最终确认后才进入完成状态。
- 组队大厅、个人组队池与作品展示按每页 12 条分页（`pageSize` 负数/0/非正整数回退默认、上限 50），翻页时保留搜索关键词。
- 每位用户只能提交一份报名资料，每位参赛者只能加入一支队伍。
- 登录邮件增加频率限制：同一邮箱存在 5 个未过期验证令牌时，会提示稍后再试，防止批量发送登录邮件。
- 报名中的联系邮箱可以与魔法链接登录邮箱不同；个人组队池会排除已入队或明确不再组队的参赛者。
- 报名阶段不收集赛道；所属赛道只在作品提交时填写。
- 每支队伍最多四人，每位参赛者最多同时保留三个待处理入队申请。
- 报名资料保存后自动进入可用状态；被管理员下架的资料不能继续公开展示或申请队伍，需要管理员恢复后重新可用。
- 成员只能由本人发起申请后经当前队长批准加入；历史成员关系需本人确认，也可由本人拒绝或退出。历史最终确认若缺少成员本人授权，会在成员响应时失效并删除快照，随后由队长重新提交。
- 只有队长可以修改队伍、转让队长、完成最终确认和提交作品。
- 名单审批、成员退出、队长转让和最终确认使用数据库事务与行锁串行化。
- 最终确认要求全员已确认，保存成员快照，并禁止继续修改名单或转让队长；待审核或已通过时不能重复提交，被驳回后名单可继续修改、成员可退出，并可按原因重新提交。
- 最终确认被驳回期间不能保存作品，需先重新提交最终确认。
- 最终确认被驳回时，确认状态与作品撤回展示在同一事务中完成；已公开作品会撤回并回到待审核。
- 作品默认私密；作品、最终确认及其关联队伍均已审核通过并授权公开后，作品才进入展示页。
- 管理员下架报名/队伍或驳回最终确认/作品时必须填写原因，提交人可以在对应页面查看并修改。
- 管理员权限始终在服务端校验，前端按钮可见性不作为安全边界。
- 只有当前管理员可以在后台新增或移除管理员；尚未注册的邮箱会预创建账户，并在首次魔法链接登录后继续保留管理员角色。移除管理员受三道保护：不能移除自己、不能移除最后一名管理员、不能移除 `ADMIN_EMAILS` 中的种子管理员（后者需改环境变量）。
- 邮箱魔法链接按客户端 IP 与登录邮箱组合滚动 60 秒限流一次；不同邮箱共享同一公网 IP 时不会互相占用额度，取不到可信客户端 IP 时跳过该项，同一邮箱仍受 5 个未过期验证令牌限制。发送请求即使 SMTP 失败也计入额度，数据库只保存由 `AUTH_SECRET` 派生的键哈希。

## Zeabur 部署

1. 在 Zeabur 中从 Git 仓库创建应用服务，平台会自动识别 Next.js。
2. 创建 PostgreSQL 服务，并将连接字符串映射到 `DATABASE_URL`。
3. 配置全部生产环境变量，将 `AUTH_URL` 设置为实际 HTTPS 域名。
4. 将 `TRUST_PROXY` 设置为 `true`，让组合限流读取 Zeabur 代理提供的客户端 IP；漏配不会阻断登录，只会跳过组合限流。
5. 执行 `npm run build`；构建前会自动应用尚未执行的数据库 migration。
6. 访问 `/api/health` 检查应用和数据库连接状态。

构建命令为 `npm run build`，启动命令为 `npm start`。构建服务必须能够连接 PostgreSQL，且数据库账户需要具备执行 migration 的权限。应用使用 Next.js standalone 输出，并会读取平台注入的 `PORT`。
