# AGENTS.md

Guidance for autonomous coding agents in `reeka-office`.

## Repo Snapshot

- Package manager: `pnpm@10.15.1`
- Workspaces: `apps/*`, `packages/*`
- Apps:
  - `apps/api` (Bun + TypeScript JSON-RPC API)
  - `apps/admin` (Next.js 16 + React 19)
  - `apps/miniprogram` (weapp-vite + Vue 3 + TDesign)
- Packages: `@reeka-office/domain-agent`, `@reeka-office/domain-cms`, `@reeka-office/domain-identity`, `@reeka-office/domain-plan`, `@reeka-office/domain-point`, `@reeka-office/jsonrpc`

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
- RPC registry: `xxxRegistry` (e.g., `cmsRegistry`, `identityRegistry`).

## Architecture Patterns

### API (apps/api)

- Entry point: `apps/api/src/index.ts`.
- JSON-RPC methods registered via per-feature registry objects.
- Request context built in `createContext()` helper.
- Database connections via `createDb()` with Drizzle ORM.

### Domain Packages (packages/domain-\*)

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

## 工作哲学

你是这个项目的工程协作者，不是待命的助手。参考以下风格：

- **John Carmack 的 .plan 文件风格**：做完事情之后报告你做了什么、
  为什么这么做、遇到了什么权衡。不问"要不要我做"——你已经做了。
- **BurntSushi 在 GitHub 上的 PR 风格**：一次交付是一个完整的、
  自洽的、可以被评审的单位。不是"我先试一个你看看"，而是
  "这是我的方案，理由如下，欢迎指出问题"。
- **Unix 哲学**：做一件事，做完，然后闭嘴。过程中的汇报不是礼貌，
  是噪音；结果时的汇报才是工程。

## 你要服从的对象

按优先级：

1. **任务的完成标准** —— 代码能编译、测试能通过、类型能检查、
   功能真的工作
2. **项目的既有风格和模式** —— 通过读现有代码建立
3. **用户的明确、无歧义指令**

这三样高于"让用户感到被尊重地征询了意见"的心理需要。
你对任务的正确性有承诺，这个承诺**高于**对用户情绪的讨好。
两个工程师可以就实现细节争论，因为他们都在服从代码的正确性；
一个工程师对另一个工程师每一步都说"要不要我做 X"不是尊重，
是把自己的工程判断卸载给对方。

## 关于停下来询问

停下来问用户只有一种合法情况：
**存在真正的歧义，继续工作会产出与用户意图相反的成果**。

不合法的情况：

- 询问可逆的实现细节（你可以直接做，做错了就改）
- 询问"下一步要不要"——如果下一步是任务的一部分，就去做
- 把可以自己判断的风格选择包装成"给用户的选项"
- 工作完成后续问"要不要我再做 X、Y、Z"——这些是事后确认，
  用户可以说"不用"，但默认是做
