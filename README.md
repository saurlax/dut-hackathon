# 大工黑客松组队中心

面向大工黑客松参赛者的全栈组队平台，提供报名资料、公开组队、最终确认、作品提交、作品展示和后台审核等功能。

## 功能

- 邮箱魔法链接登录，无需设置密码
- 参赛者报名资料填写与公开展示
- 队伍创建、编辑、成员管理和队长转让
- 入队申请与撤回
- 参赛队伍最终确认与成员快照
- 作品提交、公开展示和审核
- 基于角色的管理后台
- 桌面端与移动端响应式界面

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Auth.js 5、Nodemailer 邮箱魔法链接
- PostgreSQL 17、Drizzle ORM、Drizzle Kit
- Tailwind CSS 4、shadcn/ui、Radix UI、Lucide
- React Hook Form、Zod
- Vitest、Testing Library、Playwright

## 本地开发

需要准备 Node.js 22+、npm 10+ 和 Docker Desktop。也可以自行提供 PostgreSQL 与 SMTP 服务。

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

| 变量                    | 说明                                             |
| ----------------------- | ------------------------------------------------ |
| `DATABASE_URL`          | PostgreSQL 连接字符串                            |
| `AUTH_SECRET`           | Auth.js 密钥，至少 32 个字符                     |
| `AUTH_URL`              | 应用公开地址，本地默认为 `http://localhost:3000` |
| `EMAIL_SERVER_HOST`     | SMTP 主机地址                                    |
| `EMAIL_SERVER_PORT`     | SMTP 端口                                        |
| `EMAIL_SERVER_USER`     | SMTP 用户名                                      |
| `EMAIL_SERVER_PASSWORD` | SMTP 密码                                        |
| `EMAIL_FROM`            | 登录邮件发件人                                   |
| `ADMIN_EMAILS`          | 逗号分隔的管理员邮箱列表                         |

生产环境必须使用随机生成的 `AUTH_SECRET` 和真实 SMTP 凭据。用户完成邮箱验证后即可创建账户；`ADMIN_EMAILS` 中的账户会在登录时同步为管理员角色。

## 数据库

数据库结构定义在 `src/db/schema.ts`，SQL migration 保存在 `drizzle/`。`npm run build` 会在 Next.js 构建前自动执行尚未应用的 migration；应用请求和运行时启动不会修改数据库结构。

```bash
npm run db:generate
npm run db:migrate
```

修改 schema 后，应生成并检查 SQL migration，再与代码一同提交。业务数据涉及参赛者、队伍、成员、入队申请、最终确认成员快照和作品提交；认证表与业务表共用同一个 PostgreSQL 数据库。

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

集成测试需要已完成 migration 的测试数据库，可通过 `TEST_DATABASE_URL` 指定。完整邮箱登录 E2E 需要设置 `E2E_MAILPIT_URL`；未设置时会跳过依赖 Mailpit 的用例。

## 业务规则

- 公共页面只展示审核通过且允许公开的信息。
- 每位用户只能提交一份报名资料，每位参赛者只能加入一支队伍。
- 每支队伍最多四人，每位参赛者最多同时保留三个待处理入队申请。
- 入队申请支持提交和撤回；队长通过参赛者编号维护队伍成员。
- 只有队长可以修改队伍、转让队长、完成最终确认和提交作品。
- 最终确认会保存成员快照，并禁止继续转让队长。
- 管理员权限始终在服务端校验，前端按钮可见性不作为安全边界。

## Zeabur 部署

1. 在 Zeabur 中从 Git 仓库创建应用服务，平台会自动识别 Next.js。
2. 创建 PostgreSQL 服务，并将连接字符串映射到 `DATABASE_URL`。
3. 配置全部生产环境变量，将 `AUTH_URL` 设置为实际 HTTPS 域名。
4. 执行 `npm run build`；构建前会自动应用尚未执行的数据库 migration。
5. 访问 `/api/health` 检查应用和数据库连接状态。

构建命令为 `npm run build`，启动命令为 `npm start`。构建服务必须能够连接 PostgreSQL，且数据库账户需要具备执行 migration 的权限。应用使用 Next.js standalone 输出，并会读取平台注入的 `PORT`。
