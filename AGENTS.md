# AGENTS.md

Guidance for autonomous coding agents in `reeka-office`.

## Repo Snapshot

- Package manager: `pnpm@10.15.1`
- Workspaces: `apps/*`, `packages/*`
- Apps:
  - `apps/api` (Bun + TypeScript JSON-RPC API)
  - `apps/admin` (Next.js 16 + React 19)
  - `apps/miniprogram` (weapp-vite + Vue 3 + TDesign)
- Packages: `@reeka-office/domain-cms`, `@reeka-office/domain-user`, `@reeka-office/domain-point`, `@reeka-office/jsonrpc`

## Setup

- Install dependencies from repo root: `pnpm install`

## Commands (authoritative)

### Root

- `pnpm dev:api` -> `pnpm --filter api dev`
- `pnpm dev:admin` -> `pnpm --filter admin dev`
- `pnpm tabicon` -> `pnpm --filter reeka-office-miniprogram tabicon`
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
- `pnpm --filter admin db:generate` -> `drizzle-kit generate`
- `pnpm --filter admin db:migrate` -> `drizzle-kit migrate`
- `pnpm --filter admin db:push` -> `drizzle-kit push`

### apps/miniprogram

- `pnpm --filter reeka-office-miniprogram dev` -> `weapp-vite dev`
- `pnpm --filter reeka-office-miniprogram build` -> `weapp-vite build`
- `pnpm --filter reeka-office-miniprogram typecheck` -> `vue-tsc --noEmit -p tsconfig.app.json`
- `pnpm --filter reeka-office-miniprogram open` -> `weapp-vite open` (open devtools)

### packages

- `pnpm --filter @reeka-office/<name> build` -> `tsc -p tsconfig.json`
- `pnpm --filter @reeka-office/<name> typecheck` -> `tsc --noEmit`

## Test + Single-Test Status

- No `test` script exists at root or in workspaces.
- No test runner is currently wired.
- If you add tests, also add root/workspace `test` script(s) and documented single-test invocation.

## Workspace Targeting

- Build one workspace: `pnpm --filter <workspace> build`
- Typecheck one workspace: `pnpm --filter <workspace> typecheck`
- Lint admin only: `pnpm --filter admin lint`

## TypeScript + Modules

- `tsconfig.base.json` is strict (`strict: true`).
- `apps/miniprogram/tsconfig.app.json` uses `verbatimModuleSyntax` and Vue compiler options.
- Alias `@/*` is available in `apps/api`, `apps/admin`, and `apps/miniprogram`.
- App/package manifests use ESM (`"type": "module"`).

## Import Conventions

- Prefer import grouping: 1. external packages 2. workspace packages (`@reeka-office/...`) 3. app alias (`@/...`) 4. relative
- Use `import type` for type-only imports.
- Keep ordering/style consistent with the file being edited.

## Formatting (transitional)

- `apps/admin`, `packages/domain-*`: mostly no semicolons.
- `apps/api`, `packages/jsonrpc`: semicolons are common.
- `apps/miniprogram`: no semicolons (Vue style).
- Match local style; keep diffs narrow.

## Naming Conventions

- React components: PascalCase (`CmsServicesClient`, `AppSidebar`).
- Vue components: kebab-case (`index.vue` in page folders).
- UI files: kebab-case (`app-sidebar.tsx`).
- Domain classes: PascalCase + suffix (`CreateContentCommand`, `ListContentsQuery`).
- Functions/variables: camelCase.
- RPC registry: `xxxRegistry` (e.g., `cmsRegistry`, `userRegistry`).

## Architecture Patterns

### API (apps/api)

- Entry point: `apps/api/src/index.ts`.
- JSON-RPC methods registered via per-feature registry objects.
- Request context built in `createContext()` helper.
- Database connections via `createDb()` with Drizzle ORM.

### Domain Packages (packages/domain-*)

- CQRS pattern: `commands/` for writes, `queries/` for reads.
- Each command/query is a class with `execute()` method.
- Schema defined using Drizzle ORM.

### Admin (apps/admin)

- App Router with route groups: `(console)/` for authenticated pages.
- Server actions in `actions.ts` files for mutations.
- Use `revalidatePath()` after mutations.
- UI components in `src/components/ui/` (shadcn-based).

### Miniprogram (apps/miniprogram)

- weapp-vite + wevu framework (Vue 3 mini-program runtime).
- TDesign components prefixed with `t-` (e.g., `<t-button>`).
- Pages in `src/pages/<name>/index.vue`.
- RPC types via `@rpc-types` alias pointing to `apps/api/rpc-types.d.ts`.

## Validation + Error Handling

- JSON-RPC input validation uses Zod (`defineFunc`, `inputSchema.safeParse`).
- Contract failures raise `RpcError` with `RpcErrorCode`.
- Domain commands/queries throw `Error` with descriptive messages.
- Client-side: check `error instanceof Error` before reading `message`.
- Do not swallow errors silently.

## React / Next.js (admin)

- Use App Router layout/page patterns under `src/app`.
- Use `"use client"` and `"use server"` directives correctly.
- Prefer server actions + `revalidatePath` for mutations.
- Reuse existing primitives from `src/components/ui`.

## Vue / Miniprogram

- Use wevu composables for page lifecycle.

## Linting / Quality

- ESLint config exists only for admin: `apps/admin/eslint.config.mjs`.
- No root Prettier/Biome config.

Verification flow after edits:
1. `pnpm typecheck` (all workspaces)
2. `pnpm --filter admin lint` (when touching `apps/admin`)
3. Targeted workspace build(s) when needed

