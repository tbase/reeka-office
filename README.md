# reeka-office monorepo

## 项目结构

### apps

- `apps/miniprogram`: 小程序端
- `apps/api`: Bun API 服务
- `apps/admin`: Next.js 后台管理端

### packages

- `packages/domain-*`: 领域逻辑模块，按业务域拆分
- `packages/domain-user`: 用户身份相关的领域逻辑（登录态、身份信息、权限边界等）
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
- `pnpm dev:admin`: 启动管理端
- `pnpm build`: 构建全部 workspace
- `pnpm typecheck`: 全量 TypeScript 类型检查
