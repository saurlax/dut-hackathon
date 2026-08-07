# AGENTS.md

## Project contract

This repository is the standalone Next.js implementation of the DUT Hackathon Team Center. It must remain independent from Feishu/Miaoda. Do not add `@lark-apaas`, CapabilityService, Bitable adapters, platform user IDs, Vite, NestJS, React Router, or `lark-cli` runtime calls.

## Architecture

- `src/app/`: App Router pages, Route Handlers, and Server Actions.
- `src/components/`: application components and checked-in shadcn/ui primitives.
- `src/db/`: Drizzle schema and the server-only PostgreSQL client.
- `src/lib/`: authorization, shared Zod contracts, domain helpers, and read services.
- `drizzle/`: reviewed SQL migrations; this directory is committed.
- `tests/integration` and `tests/e2e`: PostgreSQL and browser coverage.

Pages are Server Components by default. Add `"use client"` only for browser state, form pending state, or interaction. Read data through server-only query/service modules. Mutations use Server Actions and must perform authentication, authorization, validation, and cache revalidation themselves.

## Authentication and authorization

- Auth.js uses database sessions and Nodemailer magic links. There are no passwords.
- Business ownership is keyed by `users.id`; never trust email or form-provided user IDs as ownership proof.
- `ADMIN_EMAILS` is the bootstrap source for the `admin` role and is synchronized at sign-in.
- Every protected Server Action and Route Handler must call `requireUser` or `requireAdmin`. Proxy redirects and hidden UI are convenience only, not security boundaries.
- Never log magic-link tokens, SMTP credentials, session cookies, `AUTH_SECRET`, or database URLs.

## Database rules

- Change schema only in `src/db/schema.ts`; run `npm run db:generate` and review the generated SQL.
- Never use `drizzle-kit push` in shared or production environments. Deployment applies committed migrations with `npm run db:migrate`.
- Multi-table state changes—team creation, membership replacement, leader transfer, final confirmation—must remain transactional.
- Preserve the unique constraints for one registration per user, one team per participant, one member position per team, and one confirmation/submission per team.
- Team member capacity is four. Final confirmation stores a snapshot in `confirmation_members`; do not replace it with a live join.
- Public queries must enforce both audit approval and explicit public-display consent.

## UI system

The visual direction is S2: cold white surfaces, black high-weight typography, electric blue/cyan primary signals, and restrained violet accents. Green is reserved for success/recruiting, amber for warnings/pending, and red for errors/rejection.

- Use shadcn/ui primitives, Lucide icons, CSS variables, and the existing `brand-*`, `tech-frame`, and `eyebrow` utilities.
- Keep keyboard focus visible and maintain WCAG AA contrast.
- Preserve responsive behavior; public pages are mobile-first and the admin tables may scroll horizontally.
- Do not use emoji as interface icons. Avoid unrelated template components and excessive animation.

## Commands and quality gate

All npm scripts must remain cross-platform; do not introduce bash-only environment assignment or executable shell scripts.

```text
npm run format:check
npm run lint
npm run typecheck
npm test
npm run test:integration
npm run test:e2e
npm run build
```

Add unit coverage for pure validation/state rules, PostgreSQL integration coverage for constraints and transactions, and Playwright coverage for user-visible flows. Do not add a production authentication bypass for tests; browser authentication goes through the test SMTP/Mailpit flow.

## Documentation discipline

Keep README setup, environment variables, database commands, tests, and Zeabur deployment instructions synchronized with code. When behavior changes, update the relevant business rules and acceptance tests in the same change.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
