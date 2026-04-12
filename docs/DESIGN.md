# DESIGN

## Purpose

This file defines the placement rules for `reeka-office`.

- `apps/*` = application layer
- `packages/domain-*` = domain layer
- `packages/jsonrpc` = protocol/framework infrastructure

The goal is simple: stable boundaries, predictable placement, and no leakage of UI terms into domain code.

## Rule Of Thumb

- If code describes a product, entrypoint, protocol, page, or presentation, it belongs in `apps/*`.
- If code describes business rules, business data, commands, queries, or persistence rules, it belongs in `packages/domain-*`.
- If code exists to expose domain logic through JSON-RPC, it belongs in `apps/api*`, not in domain packages.

## What Goes In `apps/*`

`apps/*` contains product-specific code.

Put these here:

- routes, pages, layouts, components, hooks, stores
- RPC method definitions, input schemas, auth/session adapters
- BFF orchestration across one or more domain packages
- DTOs and view models shaped for one client
- upload/download handlers, URL shaping, frontend state
- app codenames and product-specific namespaces such as `gege`

Examples in this repo:

- `apps/miniprogram/src/packages/gege/pages/**`
- `apps/api/src/rpc/**`
- `apps/admin/src/actions/**`

Do not put these in `apps/*` if they are reusable business rules:

- domain invariants
- persistent business data definitions
- commands/queries that still make sense after removing a page or endpoint

## What Goes In `packages/domain-*`

`packages/domain-*` contains business logic organized by business domain.

Put these here:

- business schemas and persistence mappings
- commands and queries
- domain validation and aggregation rules
- domain data structures
- DB context for that domain

Typical structure:

- `commands/`
- `queries/`
- `context.ts`
- `schema.ts` or `db/schema.ts`

Domain code must not know:

- page names
- app codenames such as `gege`
- UI terms such as `dialog`, `popup`, `chart`, `card`, `tab`
- RPC method names, HTTP paths, JSON-RPC wrappers
- client-specific view models

Domain outputs should be business-shaped:

- `monthlyMetrics`
- `teamSummary`
- `memberRelation`
- `latestPeriod`

Not presentation-shaped:

- `chartPoints`
- `dashboardCards`
- `popupPayload`
- `tableRowsForAdmin`

## Dependency Direction

Allowed direction:

`apps/*` -> `packages/domain-*`

Additional rules:

- `apps/*` may depend on multiple domain packages and compose them.
- `packages/domain-*` must not depend on `apps/*`.
- `packages/domain-*` should avoid app/product vocabulary.
- Cross-domain composition for a specific screen or endpoint should usually stay in `apps/*`.

## Naming Rules

Application layer names may use product vocabulary:

- `gege`
- `getDashboard`
- `getMetricChart`

Domain layer names should use business vocabulary:

- `ListAgentMonthlyMetricsQuery`
- `GetLatestApmPeriodQuery`

Bad smell in domain naming:

- app codenames
- page names
- chart/popup/card/table terminology

## Placement Test

Before adding code, ask:

1. If the current page or endpoint disappears, does this logic still make sense?
If yes, prefer `packages/domain-*`.

2. If the same business data is rendered as popup, table, or API response, does this logic stay unchanged?
If yes, prefer `packages/domain-*`.

3. Is this code mainly adapting business data for one client or one protocol?
If yes, prefer `apps/*`.

## Operational Rules

- Domain returns raw business data; app layer shapes it for UI.
- Do not push product codenames downward into domain packages.
- Do not pull popup/chart/card concerns upward into domain outputs.
- Prefer small app-level adapters over polluting domain naming.

## Repo-Specific Note

Current `packages/domain-performance` already contains some `gege`-named queries. Treat that as historical drift, not a precedent.

Going forward:

- keep `gege` in `apps/api/src/rpc/gege/**` and `apps/miniprogram/src/packages/gege/**`
- keep domain code named by business meaning, not by app codename
