# reeka-office monorepo

## 项目结构

### apps

- `apps/miniprogram`: 小程序端
- `apps/api`: Bun API 服务
- `apps/admin`: Next.js 后台管理端

### packages

- `packages/domain-*`: 领域逻辑模块，按业务域拆分
- `packages/domain-agent`: 租户代理人相关的领域逻辑
- `packages/domain-identity`: 中心身份与多租户绑定相关的领域逻辑
- `packages/domain-cms`: CMS 相关的领域逻辑
- `packages/jsonrpc`: JSON-RPC 服务端框架，提供协议处理与服务组织能力

## 快速开始

```bash
pnpm install
pnpm dev:api
pnpm dev:admin
```

## 常用脚本

- `pnpm dev:api`: 启动 API 服务
- `pnpm dev:api-center`: 启动中心身份 API
- `pnpm dev:admin`: 启动管理端
- `pnpm db:push:business`: 推送租户业务库 schema
- `pnpm db:push:identity`: 推送中心身份库 schema
- `pnpm build`: 构建全部 workspace
- `pnpm typecheck`: 全量 TypeScript 类型检查
