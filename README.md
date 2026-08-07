# 大工黑客松组队中心

第二届大工黑客松的报名、公开组队、最终确认、作品提交与管理平台。本项目由飞书妙搭版本完整迁移而来，现为不依赖任何飞书运行时的标准 Next.js 全栈应用。

## 技术栈

- Next.js 16 App Router、React 19、TypeScript
- Auth.js 5 + Nodemailer 邮箱魔法链接
- PostgreSQL 17 + Drizzle ORM/Drizzle Kit
- Tailwind CSS 4 + shadcn/ui + Radix UI
- Zod、React Hook Form
- Vitest、Testing Library、Playwright

## 本地启动

要求 Node.js 22+、npm 10+、Docker Desktop（或可用的 PostgreSQL 与 SMTP 服务）。

```bash
cp .env.example .env.local
docker compose up -d
npm install
npm run db:migrate
npm run db:seed       # 可选：写入一名演示参赛者
npm run dev
```

应用地址为 <http://localhost:3000>，Mailpit 邮箱界面为 <http://localhost:8025>。Windows PowerShell 可用 `Copy-Item .env.example .env.local` 代替 `cp`。

## 环境变量

| 变量                         | 说明                                         |
| ---------------------------- | -------------------------------------------- |
| `DATABASE_URL`               | PostgreSQL 连接串                            |
| `AUTH_SECRET`                | 至少 32 字符的 Auth.js 密钥                  |
| `AUTH_URL`                   | 对外访问地址，本地为 `http://localhost:3000` |
| `EMAIL_SERVER_HOST/PORT`     | SMTP 地址与端口                              |
| `EMAIL_SERVER_USER/PASSWORD` | SMTP 凭据                                    |
| `EMAIL_FROM`                 | 登录邮件发件人                               |
| `ADMIN_EMAILS`               | 逗号分隔的管理员邮箱；登录时同步角色         |

生产环境必须使用真实 SMTP 凭据和随机 `AUTH_SECRET`。任何完成邮箱验证的用户都可以注册。

## 数据库

修改 `src/db/schema.ts` 后生成并检查 SQL，再提交 migration：

```bash
npm run db:generate
npm run db:migrate
npm run db:studio
```

业务表包括参赛者、队伍、成员、入队申请、最终确认成员快照与作品提交；Auth.js 表与业务表使用同一个 PostgreSQL 数据库。应用启动不会自动修改数据库。

## 验证命令

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

集成测试要求迁移后的测试 PostgreSQL，可通过 `TEST_DATABASE_URL` 指定。完整邮箱 E2E 需要设置 `E2E_MAILPIT_URL`；未设置时仅跳过依赖 Mailpit 的用例。

## Zeabur 部署

1. 在 Zeabur 中从本 Git 仓库创建服务；平台会自动识别 Next.js。
2. 创建 PostgreSQL 服务，并把连接串映射为 `DATABASE_URL`。
3. 设置 `.env.example` 中的所有生产变量，`AUTH_URL` 使用实际 HTTPS 域名。
4. 首次部署前或数据库结构变更时，在应用环境运行一次 `npm run db:migrate`。
5. 使用 `/api/health` 检查应用与数据库连通性。

构建命令为 `npm run build`，启动命令为 `npm start`；Next.js 会读取 Zeabur 注入的 `PORT`。仓库启用了 standalone 输出，但不依赖自定义容器或妙搭发布配置。

## 业务说明

- 公共大厅只展示已审核且主动公开的报名、队伍与作品。
- 每名用户只能有一份报名，每名参赛者只能加入一支队伍，每队最多四人。
- 每人最多同时保留三个待处理入队申请；当前版本与原系统一致，只支持申请和撤回，队长通过参赛者编号维护成员。
- 只有队长可以修改队伍、转让队长、最终确认和提交作品；最终确认后锁定成员快照并禁止转让。
- 所有管理员操作均在服务端检查 `admin` 角色，隐藏按钮不作为安全边界。
