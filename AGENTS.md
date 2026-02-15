# AGENTS.md

Guidance for autonomous coding agents in `reeka-office`.

## Repo Snapshot

- Package manager: `pnpm@10.15.1`
- Workspaces: `apps/*`, `packages/*`
- Apps:
  - `apps/api` (Bun + TypeScript JSON-RPC API)
  - `apps/admin` (Next.js 16 + React 19)
  - `apps/miniprogram` (placeholder only)
- Packages:
  - `@reeka-office/domain-cms`
  - `@reeka-office/domain-user`
  - `@reeka-office/jsonrpc`

## Setup

- Install dependencies from repo root: `pnpm install`

## Commands (authoritative)

### Root

- `pnpm dev:api` -> `pnpm --filter api dev`
- `pnpm dev:admin` -> `pnpm --filter admin dev`
- `pnpm build` -> `pnpm -r --if-present build`
- `pnpm typecheck` -> `pnpm -r --if-present typecheck`

### apps/api

- `pnpm --filter api dev` -> `bun --watch src/index.ts`
- `pnpm --filter api build` -> `bun build src/index.ts --outdir dist --target bun`
- `pnpm --filter api start` -> `bun dist/index.js`
- `pnpm --filter api typecheck` -> `tsc --noEmit`

### apps/admin

- `pnpm --filter admin dev` -> `next dev`
- `pnpm --filter admin build` -> `next build`
- `pnpm --filter admin start` -> `next start`
- `pnpm --filter admin lint` -> `eslint`

### packages

- `pnpm --filter @reeka-office/domain-cms build` -> `tsc -p tsconfig.json`
- `pnpm --filter @reeka-office/domain-cms typecheck` -> `tsc --noEmit`
- `pnpm --filter @reeka-office/domain-user build` -> `tsc -p tsconfig.json`
- `pnpm --filter @reeka-office/domain-user typecheck` -> `tsc --noEmit`
- `pnpm --filter @reeka-office/jsonrpc build` -> `tsc -p tsconfig.json`
- `pnpm --filter @reeka-office/jsonrpc typecheck` -> `tsc --noEmit`

## Test + Single-Test Status

- No `test` script exists at root or in workspaces.
- No test runner is currently wired (no valid single-test command today).
- `apps/miniprogram` has no build/lint/test scripts.

If you add tests, also add:

- root/workspace `test` script(s)
- package-level `test` script(s)
- documented single-test invocation, e.g.:
  - `pnpm --filter <workspace> test -- <path-to-test-file>`

## Workspace Targeting Patterns

- Build one workspace: `pnpm --filter <workspace> build`
- Typecheck one workspace: `pnpm --filter <workspace> typecheck`
- Lint admin only: `pnpm --filter admin lint`

## TypeScript + Modules

- `tsconfig.base.json` is strict (`strict: true`).
- `apps/admin/tsconfig.json` is strict with `noEmit: true`.
- `apps/api/tsconfig.json` extends base config and includes Bun types.
- Alias `@/*` is available inside both `apps/api` and `apps/admin`.
- App/package manifests use ESM (`"type": "module"`).

## Import Conventions

- Prefer import grouping:
  1. external packages
  2. app alias imports (`@/...`)
  3. relative imports
- Use `import type` for type-only imports.
- Keep ordering/style consistent with the file being edited.

## Formatting Conventions (transitional)

- `apps/admin` and much of `packages/domain-cms`: mostly no semicolons.
- `apps/api` and `packages/jsonrpc`: semicolons are common.
- Do not normalize formatting across files; match local style.
- Keep diffs narrow; avoid unrelated reformatting.

## Naming Conventions

- React component names: PascalCase (`CmsServicesClient`, `AppSidebar`).
- UI file names: kebab-case (`app-sidebar.tsx`, `button.tsx`).
- Domain classes: PascalCase + suffix (`CreateContentCommand`, `ListContentsQuery`).
- Functions/variables: camelCase.
- Stable constants: UPPER_SNAKE_CASE where already established (`PATH`, `GLOBAL_KEY`).

## Architecture Patterns

- API entrypoint and route registration are centralized in `apps/api/src/index.ts`.
- JSON-RPC methods are registered via per-feature registry objects (e.g. `cmsRegistry`).
- Request context is built in dedicated helpers (`createContext`).
- Domain persistence goes through command/query classes in `packages/domain-cms`.
- Database wiring is centralized in `packages/domain-cms/src/context.ts` (`setup`, `getDb`, `close`).

## Validation + Error Handling

- JSON-RPC method input validation uses Zod (`defineFunc`, `inputSchema.safeParse`).
- Contract/request failures should raise `RpcError` with `RpcErrorCode`.
- Server-side unexpected errors are logged and returned as structured internal errors with `requestId`.
- Client-side error handling checks `error instanceof Error` before reading `message`.
- Do not swallow errors silently.

## React / Next.js (admin)

- Use App Router layout/page patterns under `src/app`.
- Use `"use client"` and `"use server"` directives correctly.
- Prefer server actions + `revalidatePath` for mutations.
- Keep interactive state in client components; fetch on server where practical.
- Reuse existing primitives from `src/components/ui`.

## Linting / Quality Workflow

- ESLint config exists only for admin: `apps/admin/eslint.config.mjs`.
- No root lint script exists.
- No root Prettier/Biome config exists.

Recommended verification flow after edits:

1. `pnpm typecheck`
2. `pnpm --filter admin lint` (when touching `apps/admin`)
3. targeted workspace build(s) when needed


## Source Files Used

- `package.json`
- `pnpm-workspace.yaml`
- `README.md`
- `apps/api/package.json`
- `apps/admin/package.json`
- `packages/domain-cms/package.json`
- `packages/domain-user/package.json`
- `packages/jsonrpc/package.json`
- `tsconfig.base.json`
- `apps/api/tsconfig.json`
- `apps/admin/tsconfig.json`
- `apps/admin/eslint.config.mjs`
