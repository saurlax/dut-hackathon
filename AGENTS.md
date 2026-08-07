# AGENTS.md

## 项目说明

本仓库是大工黑客松组队中心的 Next.js 全栈应用。所有改动应围绕当前产品功能、技术架构和部署方式展开，避免加入与项目无关的平台适配层或运行时依赖。

## 目录结构

- `src/app/`：App Router 页面、Route Handlers 和 Server Actions。
- `src/components/`：业务组件与项目内维护的 shadcn/ui 基础组件。
- `src/db/`：Drizzle schema 与仅服务端使用的 PostgreSQL 客户端。
- `src/lib/`：鉴权、共享 Zod schema、领域规则和查询服务。
- `drizzle/`：经过审查并纳入版本控制的 SQL migrations。
- `tests/integration/`：PostgreSQL 服务层集成测试。
- `tests/e2e/`：Playwright 端到端测试。

页面默认使用 Server Components。只有浏览器状态、表单 pending 状态或交互确有需要时才添加 `"use client"`。读取数据应通过仅服务端的查询或服务模块，写操作使用 Server Actions，并在操作内部完成身份认证、权限校验、数据验证和缓存刷新。

## 认证与权限

- Auth.js 使用数据库 session 和 Nodemailer 邮箱魔法链接，不提供密码登录。
- 业务数据所有权以 `users.id` 为准，不得将邮箱或表单传入的用户 ID 作为所有权证明。
- `ADMIN_EMAILS` 是管理员角色的初始化来源，并在用户登录时同步。
- 所有受保护的 Server Actions 和 Route Handlers 必须调用 `requireUser` 或 `requireAdmin`。
- 页面跳转和隐藏按钮只改善用户体验，不能替代服务端权限检查。
- 禁止记录魔法链接 token、SMTP 凭据、session cookie、`AUTH_SECRET` 或数据库连接字符串。

## 数据库规则

- 只在 `src/db/schema.ts` 修改数据库结构，然后运行 `npm run db:generate` 并审查生成的 SQL。
- 共享环境和生产环境禁止使用 `drizzle-kit push`。`npm run build` 会先调用 `npm run db:migrate`，只应用已提交且尚未执行的 migrations。
- 构建环境必须提供可连接且具有 migration 权限的 PostgreSQL 数据库；不得在应用请求中创建或修改表结构。
- 队伍创建、成员替换、队长转让和最终确认等多表状态变更必须使用事务。
- 保持一名用户一份报名、一名参赛者一支队伍、每队成员位置唯一、每队一份最终确认和作品提交等约束。
- 每队最多四名成员。最终确认必须写入 `confirmation_members` 快照，不得替换为实时关联查询。
- 公共查询必须同时校验审核状态和用户的公开展示授权。

## 界面规范

视觉风格使用冷白背景、黑色高字重排版、电蓝与青色主信号，并少量使用紫色点缀。绿色用于成功或招募，琥珀色用于警告或待处理，红色用于错误或拒绝。

- 优先使用现有 shadcn/ui 组件、Lucide 图标、CSS variables，以及 `brand-*`、`tech-frame`、`eyebrow` 工具类。
- 保持清晰的键盘焦点和 WCAG AA 对比度。
- 公共页面采用移动优先的响应式设计；后台表格可在小屏幕横向滚动。
- 不使用 emoji 充当界面图标，不引入无关模板组件或过度动画。

## 开发与质量门禁

npm scripts 必须兼容 Windows 和 Linux，不得加入只适用于 Bash 的环境变量赋值或可执行 shell 脚本。

```text
npm run check
npm test
npm run test:integration
npm run test:e2e
npm run build
```

纯验证和状态规则使用单元测试；数据库约束与事务使用 PostgreSQL 集成测试；用户可见流程使用 Playwright。测试认证必须通过测试 SMTP/Mailpit 邮件流程，不得添加生产认证绕过逻辑。

## 文档维护

代码行为发生变化时，同步更新 README 中的配置、环境变量、数据库、测试、部署和业务规则说明，并更新对应的自动化测试。

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
