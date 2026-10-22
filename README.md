# HR Forte Tools

Internal tools for the HR Forte team: environment health, releases and changelogs, partner integrations, feature flags, GitHub workflows, shared environment variables, links, notes and a whiteboard. It's one Next.js app.

## Features

| Page | What it does | Access |
|---|---|---|
| **Dashboard** | Health and version of each environment (MIA, EVA, DEV, MAP, E-Smart, .NET) | User |
| **App Versions** | App and component releases (changelog), including creating releases by date range | User |
| **E-Smart Time** | Sync or unsync companies with E-Smart Time per environment | User |
| **AskGenie** | Sync or unsync companies with AskGenie per environment | User |
| **Feature Flags** | Default flags and per-company overrides (every change asks for confirmation) | User |
| **GitHub** | Managed repos, PRs, quick merge, deploy presets, Actions secrets and variables | **Admin** |
| **Environment Variables** | Encrypted (AES-256-GCM) shared env vars per environment, with import and export | User |
| **Links / Notes** | Team bookmarks (Admin edits) and Markdown notes (private or shared) | User |
| **Users** | Create, archive and assign roles to users | **Admin** |
| **Excalidraw** | Whiteboard. Works without signing in; saving to the cloud needs a login | Public |

## Tech stack

- **Next.js 15** (App Router, `output: 'standalone'`), **React 19**, **TypeScript**
- **Tailwind CSS v4**, shadcn/Radix UI, `motion`, lucide/tabler icons
- **TanStack Query** for data fetching, react-hook-form + zod for forms
- **Prisma** + **MongoDB**; `mongo-migrate-ts` for data migrations
- JWT auth (`jsonwebtoken`, `bcryptjs`)
- **Bun** as the package manager and runtime (CI and Docker)

## Getting started

### Prerequisites
- [Bun](https://bun.sh) ≥ 1.2 (CI pins `1.2.20`)
- A MongoDB **replica set** (MongoDB Atlas works). Prisma's MongoDB connector requires one.

### Setup

```bash
bun install
cp .env.example .env        # then fill in the values (see below)
bun run prisma:generate
bun run prisma:db:push      # creates collections and indexes
bun run db:migrate:up       # seeds roles/users (first time only)
bun run dev                 # http://localhost:3000
```

> ⚠️ The seed migration creates accounts with a default password. Change it right after the first login.

## Environment variables

All configuration comes from environment variables. **Secrets have no fallback values in code**, so a missing secret makes the matching feature fail closed. Never commit `.env*` files except `.env.example`.

| Variable | Secret | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | Prisma MongoDB connection string |
| `DATABASE_URI`, `DATABASE_NAME` | ✅ / – | Used by the data migrations (`scripts/migrate.sh`) |
| `JWT_SECRET` | ✅ | Signs access and refresh tokens. Use a long random value |
| `JWT_EXPIRES_IN`, `REFRESH_TOKEN_EXPIRES_IN` | – | Token lifetimes (default `7d` / `30d`) |
| `BCRYPT_SALT_ROUNDS` | – | Password hashing cost (default `10`) |
| `ENV_VARS_ENCRYPTION_KEY` | ✅ | 32-byte hex key (`openssl rand -hex 32`) for env-var values. **Changing it makes stored values unreadable** unless they're re-encrypted |
| `GITHUB_TOKEN` | ✅ | GitHub token used by the server-side `/api/github/**` routes |
| `GITHUB_ORG`, `GITHUB_API_URL`, `GITHUB_QUICK_MERGE_RULES` | – | GitHub settings |
| `DEV_API_KEY`, `MIA_API_KEY`, `EVA_API_KEY`, `MAP_STAGING_API_KEY`, `MAP_PRODUCTION_API_KEY` | ✅ | Partner API keys. The proxy attaches them on the server |
| `*_API_URL` (MIA, EVA, DEV, MAP_*, E_SMART_TIME_*, *_NET_CORE) | – | Partner base URLs (sensible defaults built in) |
| `HRF_TOOL_API_URL` | – | This app's API base URL (default `http://localhost:3000/api` in dev, `https://tools.hrforte.com/api` in prod) |

`.env.example` lists every variable.

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Dev server (Turbopack) |
| `bun run build` / `bun run start` | Production build / start |
| `bun run lint`, `bun run format` | ESLint / Prettier |
| `bun run prisma:generate` | Regenerate the Prisma client (`src/lib/generated/prisma`) |
| `bun run prisma:db:push` | Sync the schema and indexes to the database |
| `bun run prisma:studio` | Browse data |
| `bun run db:migrate:up` / `:down` / `:status` / `:new` | Data migrations (`src/lib/database/migrations`) |

## Project structure

```
src/
├── app/
│   ├── (auth)/          sign-in, logout
│   ├── (main)/          authenticated pages (each has its own layout.tsx for the page title)
│   ├── (public)/        excalidraw
│   └── api/             route handlers (auth, users, github, proxy, env vars, notes, links, …)
├── components/          ui/ (shadcn), confirm-dialog, query-error, safe-markdown, …
├── config/
│   ├── index.ts         client-safe config only (bundled into the browser)
│   └── server.ts        server-only config and secrets, partner proxy targets
├── lib/
│   ├── api/             axios client + endpoint registry (api-client-factory.ts)
│   ├── middlewares/     auth (handleAuth / requireRole), rate limiter, CORS
│   ├── github/          GitHub REST service (server only)
│   ├── crypto/          env-var value cipher
│   ├── error/           AppError, error constants, API error wrapper
│   └── prisma/          schema.prisma + client singleton
└── modules/<feature>/   *.client.ts (HTTP), *.query.ts (TanStack hooks), *.service.ts (DB), *.type.ts
```

## Architecture notes

### Authentication and authorization
- Login returns an access token and a refresh token, stored in `localStorage`. Each token carries a `typ` claim, so a refresh token can't be used as an access token. The algorithm is pinned to HS256.
- **Every API route enforces its own auth.** The middleware only handles CORS and rate limiting.
  - `handleAuth(request)` requires any valid access token.
  - `requireRole(request, ...roles)` / `requireAdmin(request)` load the roles from the **database**, so archived users and revoked roles lose access immediately.
- Admin-only APIs: `/api/github/**`, `/api/users`, and the user role, archive and unarchive routes, plus link and link-group writes. On the client, `MainContainer` also redirects non-admins away from `/users` and `/github`.
- Public sign-up is disabled (`/api/auth/register` returns 403). Admins create users from the **Users** page.

### Partner API proxy
The browser never holds partner credentials. Client calls to partner endpoints (MIA, EVA, DEV, MAP_*, E-Smart, .NET) go to:

```
/api/proxy/<ENDPOINT>/<path>?<query>
```

The proxy requires login and only accepts endpoints in `PROXY_TARGETS` (`src/config/server.ts`). It attaches the partner `ApiKey` server-side, never forwards our JWT, and returns the upstream status and body unchanged. To add a partner endpoint:
1. Add it to `PROXY_TARGETS` (URL plus optional key env var).
2. Add an entry in `api-client-factory.ts` with `baseURL: proxyURL('<NAME>')`.
3. Add the name to `EndpointName` in `src/lib/api/types.ts`.

> Never put credentials in `src/config/index.ts` or `src/lib/api/*`. Those files ship to the browser.

### Conventions
- **API input:** validate request bodies with zod via `parseBody(request, schema)` (`src/lib/utils/parseBody.ts`). It strips unknown fields, which prevents mass assignment.
- **Markdown:** render user or external Markdown with `@/components/safe-markdown`, never with `markdown-to-jsx` directly.
- **Risky actions:** confirm with `@/components/confirm-dialog`.
- **Failed loads:** show `@/components/query-error` instead of an empty state.
- **Production errors:** responses include only `code`, `message` and `requestId` (no stack traces or details).

## Deployment

The Dockerfile builds a standalone Next.js server on `oven/bun:1` and runs it as the non-root `nextjs` user on port `3000`. `.env` is excluded from the image, so **supply every variable from `.env.example` at runtime**. After schema changes, run `bun run prisma:db:push` against the target database.

CI (`.github/workflows/ci.yml`) installs dependencies, generates the Prisma client, then lints and builds on pushes and PRs to `main`/`master`.

