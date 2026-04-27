---
name: domain-best-practices
description: Use when creating, reviewing, or refactoring `packages/domain-*` code in reeka-office, especially DDD/CQRS boundaries, commands, queries, repositories, infra adapters, runtime wiring, domain-shared usage, or app-vs-domain responsibility decisions.
---

# Domain Best Practices

This skill is for repo-native domain package work in `reeka-office`. Use it when the task touches `packages/domain-*`, DDD structure, bounded contexts, repository contracts, command/query design, domain events, read models, or whether logic belongs in a domain package versus an app layer.

## Reference Packages

Use current repo code as the source of truth before making changes:

- `packages/domain-agent`: agent aggregate, repositories, domain events, import command, downstream compatibility pressure.
- `packages/domain-performance`: performance facts, policies, ports, commands/queries, runtime wiring.
- `packages/domain-crm`: newer bounded-context shape with commands, queries, schema, runtime, and integration tests.
- `packages/domain-shared`: narrow shared primitives only.

Do not start from generic DDD templates. Mirror the closest existing package first, then simplify where the feature is smaller.

## Core Workflow

1. Inspect the existing bounded context and downstream imports with `rg`.
2. Identify whether the change is write behavior, read behavior, app presentation, or infrastructure wiring.
3. Keep the smallest API that satisfies the use case.
4. Put business rules in domain objects, policies, or commands; put persistence details in infra adapters.
5. Keep page-facing DTO assembly in `apps/api`, not in `packages/domain-*`.
6. Add or adjust focused tests when changing domain behavior.
7. Run targeted verification first, then broader verification when the package boundary changed.

## Package Shape

Prefer this structure for new or reshaped bounded contexts:

```text
packages/domain-<name>/src/
  application/        # runtime types or application services when needed
  commands/           # writes, orchestration, transactions
  domain/             # entities, value objects, policies, ports, repository contracts
  infra/              # Drizzle repositories, adapters, default dependency wiring
  queries/            # reads, read-model access, light orchestration
  context.ts          # DB setup/context if the package owns schema access
  schema.ts           # public schema export
  index.ts            # package root exports
```

Use `db/schema/` only when the package already follows that shape or needs a multi-file schema. Match local package style instead of forcing uniformity.

## Dependency Direction

Allowed dependencies:

- `commands/` may depend on `domain/`, repository interfaces, runtime wiring, and transaction helpers.
- `queries/` may depend on read repository interfaces and runtime wiring.
- `domain/` may depend on shared primitives and local value objects.
- `infra/` may depend on Drizzle schema, DB context, and domain repository interfaces.
- `apps/api` may compose domain commands/queries into RPC responses.

Avoid these dependencies:

- Domain packages importing `apps/*`.
- Domain packages importing miniprogram/admin UI concerns.
- Domain packages using app codenames such as `gege` for domain concepts.
- Domain objects depending on Drizzle, RPC, WeChat, React, Vue, or page-specific DTOs.
- `domain-shared` accumulating feature-specific helpers.

## Commands

Commands are for writes and business transitions.

Good command behavior:

- Validate and normalize input at the command/domain boundary.
- Load only the facts needed for the decision.
- Use repositories through interfaces or runtime dependencies.
- Wrap multi-write operations in the package transaction helper when available.
- Throw descriptive `Error`s for domain failures.
- Return small, explicit results.

Avoid:

- Returning page-shaped DTOs from commands.
- Mixing admin/miniprogram labels into command results.
- Recomputing large read models inside a write unless the write requires it.
- Silently swallowing domain failures.

## Queries

Queries are for reads and read models.

Good query behavior:

- Keep query inputs explicit and narrow.
- Add filters to existing list queries when they are the same read model.
- Create a new query only when the output shape or responsibility is genuinely different.
- Return domain/read-model facts, not UI layout models.
- Keep app-specific aggregation, labels, chart shaping, and multi-query presentation in `apps/api`.

For example, prefer:

- `ListCustomerTypeSummariesQuery({ enabled: true })` for a filtered summary list.
- `GetCustomerTypeConfigQuery({ customerTypeId })` when profile fields or follow-up statuses are actually needed.

Avoid:

- Loading full configs for a simple navigation list.
- Adding parallel repository methods that duplicate an existing query with only a filter difference.
- Putting mobile/admin page sections into `packages/domain-*`.

## Repositories And Infra

Repository interfaces live in `domain/` and describe what the domain/application needs, not how tables are shaped.

Infra adapters:

- Implement repository contracts.
- Own Drizzle joins, SQL filters, table writes, and row-to-read-model mapping.
- Keep SQL-derived values semantically typed. Do not collapse numeric business metrics into booleans unless the domain model really says so.
- Keep output deterministic with explicit ordering.

When adding filters:

- Define a small filter type in `domain/readModels.ts` or near the query input.
- Accept optional filters on the repository method.
- Translate filters to SQL in infra.
- Update in-memory test repositories at the same time.

## Domain Models And Policies

Use domain objects and policies for real business rules:

- Invariants and normalization.
- Eligibility/qualification decisions.
- Cross-field validation.
- Snapshot/import semantics.
- Promotion or hierarchy rules.

Keep these out of domain models:

- Page copy, UI labels, route names, app codenames.
- JSON-RPC validation schemas.
- TDesign/admin component shapes.
- Convenience formatting for a single screen.

Before introducing an aggregate, answer:

- What state does it protect?
- Which transitions must be valid together?
- Which external facts does it need?
- Is this truly core behavior or just read-side composition?

## `domain-shared`

Keep `domain-shared` narrow. It is for shared-kernel primitives only:

- Aggregate base types.
- Generic validation helpers.
- Neutral date/month helpers.
- Types that are truly cross-domain and stable.

Do not put these in `domain-shared`:

- Feature policies.
- Repository ports.
- App-facing helpers.
- Business terminology that belongs to one bounded context.
- Generic "utils" moved only to reduce duplication.

## API Layer Boundary

Use `apps/api` for interface composition:

- JSON-RPC input schemas.
- Auth/context handling.
- Page-facing DTO assembly.
- Labels, charts, tabs, grouped sections, and mobile/admin response shaping.
- Combining multiple domain queries for one screen.

If a response exists only because a page needs it, start in `apps/api`. Move logic into a domain package only when it is reusable business behavior or a stable domain fact.

## Compatibility

For existing packages with broad downstream use:

- Preserve package-root exports unless the user explicitly asks to remove compatibility.
- Search downstream imports before renaming or moving files.
- Remove dead compatibility layers only when the replacement is already in use and the user has accepted cleanup.
- Keep migration diffs narrow and reviewable.

## Testing And Verification

When touching a domain package:

- Run `pnpm --filter @reeka-office/domain-<name> typecheck`.
- Run package tests if a test script exists.
- Run affected app typechecks when exported types or RPC contracts changed.
- Run `pnpm --filter admin lint` when touching `apps/admin`.
- Run `pnpm typecheck` for cross-package contract changes.

For behavior changes, add focused tests in the domain package. If no runner exists for the touched package, state that and use typecheck/build verification.

## Review Checklist

Before finishing, check:

- Does the change follow an existing package shape?
- Are domain concepts free of app/UI names?
- Are page-facing DTOs kept out of `packages/domain-*`?
- Are repository methods minimal and non-duplicative?
- Are filters on existing queries used instead of parallel methods when the shape is the same?
- Are full configs loaded only where config details are actually needed?
- Are `domain-shared` additions truly shared-kernel material?
- Did verification cover the touched package and affected consumers?
