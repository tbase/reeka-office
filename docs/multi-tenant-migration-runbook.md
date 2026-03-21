# 多租户迁移执行手册

本文档用于指导 `reeka-office` 从当前单租户/弱隔离状态迁移到“中心身份库 + 每租户独立业务系统”的多租户模式。

当前代码实现对应以下组件：

- 租户后台：`apps/admin`
- 租户业务 API：`apps/api`
- 中心身份 API：`apps/api-center`
- 小程序：`apps/miniprogram`
- 租户代理人领域：`packages/domain-agent`
- 中心身份领域：`packages/domain-identity`

## 1. 目标架构

### 1.1 租户业务侧

- 每个租户独立部署一套 `admin`
- 每个租户独立部署一套 `api`
- 每个租户独立使用自己的业务数据库
- 每个租户通过唯一 `TENANT_CODE` 标识
- 租户业务域只围绕 `agent_id` 运转，不再依赖本地 `user_id`

### 1.2 中心身份侧

- 所有微信用户身份统一存放在中心库
- 用户与租户、代理人的绑定关系统一存放在中心库
- 绑定码统一存放在中心库
- 小程序先访问中心 API，再按当前租户访问租户 API

## 2. 数据边界

### 2.1 中心库负责

- `tenants`
- `users`
- `user_tenant_bindings`
- `binding_tokens`

### 2.2 租户业务库负责

- `agents`
- CMS 业务数据
- 积分业务数据
- 计划业务数据

### 2.3 已经明确废弃的设计

- 租户业务库中的本地 `users -> agent_id` 绑定关系
- 基于租户本地 `users` 表判断当前登录代理人

说明：

- 代码已经不再使用租户库 `users` 表
- 如果历史数据库里仍然存在该表，需要在迁移完成后由 DBA 或迁移脚本下线

## 3. 迁移前准备

### 3.1 准备租户清单

为每个租户准备以下信息：

- `tenant_code`
- `tenant_name`
- `admin_domain`
- `api_service_name`
- 租户业务库连接信息
- 管理员初始账号信息

建议 `api_service_name` 命名规则：

```text
reeka-office-api-{tenant_code}
```

例如：

```text
tenant_code=zc
api_service_name=reeka-office-api-zc
```

### 3.2 准备中心服务环境

准备一套独立的中心库，用于 `apps/api-center`。

`apps/api-center` 当前只读取：

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

## 4. 数据库结构初始化

### 4.1 初始化中心库

根目录已经提供两套 Drizzle 配置：

- `drizzle/business.config.ts`
- `drizzle/identity.config.ts`

该配置支持以下回退逻辑：

- `CENTER_DB_HOST ?? DB_HOST`
- `CENTER_DB_PORT ?? DB_PORT`
- `CENTER_DB_USER ?? DB_USER`
- `CENTER_DB_PASSWORD ?? DB_PASSWORD`
- `CENTER_DB_NAME ?? DB_NAME`

执行中心库建表：

```bash
pnpm db:push:identity
```

如果需要先生成 migration：

```bash
pnpm db:generate:identity
pnpm db:migrate:identity
```

### 4.2 初始化租户业务库

对每个租户，使用对应租户库连接执行：

```bash
pnpm db:push:business
```

说明：

- `db:push:business` 只针对租户业务库
- `db:push:identity` 只针对中心库
- 不要混用

## 5. 中心库基础数据初始化

### 5.1 注册租户

向中心库 `tenants` 表插入每个租户一条记录，字段至少包含：

- `tenant_code`
- `tenant_name`
- `admin_domain`
- `api_service_name`
- `status = active`

示例：

```sql
insert into tenants (
  tenant_code,
  tenant_name,
  admin_domain,
  api_service_name,
  status
) values (
  'zc',
  '资产租户',
  'zc-admin.example.com',
  'reeka-office-api-zc',
  'active'
);
```

### 5.2 校验中心租户注册结果

建议执行：

```sql
select tenant_code, admin_domain, api_service_name, status
from tenants
order by tenant_code;
```

## 6. 应用环境变量配置

### 6.0 本地多租户环境目录

仓库已经约定本地多租户环境目录：

```text
env/local/tenants/<tenant_code>/
  admin.env.local
  api.env.local
```

用途：

- 作为每个租户本地环境变量的主模板目录
- 由 `super-cli tenant create` 自动生成
- 再复制或软链到 `apps/admin/.env.local`、`apps/api/.env.local`

创建租户并自动生成本地模板：

```bash
pnpm --filter admin super -- tenant create \
  --tenant-code zc \
  --tenant-name "资产租户" \
  --admin-domain zc-admin.example.com
```

默认行为：

- 在中心库写入或更新 `tenants` 记录
- 在 `env/local/tenants/<tenant_code>/` 下生成本地模板

如不希望生成本地模板：

```bash
pnpm --filter admin super -- tenant create ... --no-env-files
```

### 6.1 租户后台 `apps/admin`

每个租户后台实例都需要配置：

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

CENTER_DB_HOST=
CENTER_DB_PORT=
CENTER_DB_USER=
CENTER_DB_PASSWORD=
CENTER_DB_NAME=

TENANT_CODE=
COS_BUCKET=
```

说明：

- `DB_*` 指向当前租户业务库
- `CENTER_DB_*` 指向中心库
- 如未显式配置 `CENTER_DB_*`，代码会自动回退到 `DB_*`
- `TENANT_CODE` 必须与中心库 `tenants.tenant_code` 一致

### 6.2 租户 API `apps/api`

每个租户 API 实例都需要配置：

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

CENTER_DB_HOST=
CENTER_DB_PORT=
CENTER_DB_USER=
CENTER_DB_PASSWORD=
CENTER_DB_NAME=

TENANT_CODE=
```

说明：

- `apps/api` 会用 `TENANT_CODE + openid` 到中心库解析当前租户对应的 `agent_id`

### 6.3 中心 API `apps/api-center`

配置：

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=
PORT=3010
HOSTNAME=0.0.0.0
```

### 6.4 小程序 `apps/miniprogram`

至少配置：

```env
VITE_CLOUD_ENV=
VITE_CLOUD_APPID=
VITE_CENTER_SERVICE_NAME=
```

本地联调可选：

```env
VITE_LOCAL_API=
VITE_CENTER_LOCAL_API=
VITE_LOCAL_OPENID=
VITE_LOCAL_ENV=
```

说明：

- 小程序会先访问 `VITE_CENTER_SERVICE_NAME`
- 进入某租户后，会根据中心库返回的 `api_service_name` 动态选择业务服务

## 7. 部署顺序

建议严格按以下顺序执行。

### 7.1 部署中心 API

```bash
pnpm --filter api-center build
pnpm --filter api-center start
```

确认中心 API 可访问：

- `GET /identity/my-tenants`
- `POST /identity/bind-by-token`

### 7.2 部署每个租户的 API

```bash
pnpm --filter api build
pnpm --filter api start
```

每个实例需要不同的：

- `DB_*`
- `CENTER_DB_*`
- `TENANT_CODE`

### 7.3 部署每个租户的 admin

```bash
pnpm --filter admin build
pnpm --filter admin start
```

并将租户域名指向对应实例：

- `zc-admin.example.com -> zc admin`
- `abc-admin.example.com -> abc admin`

## 8. 历史数据迁移

适用于旧系统中已有租户业务库本地 `users(openid, agent_id)` 的情况。

### 8.1 迁移目标

将历史绑定关系迁移到中心库：

- `users`
- `user_tenant_bindings`

### 8.2 迁移输入

从每个租户业务库提取：

- `openid`
- `agent_id`

并附带固定租户值：

- `tenant_code`

### 8.3 迁移规则

1. 若中心库 `users` 不存在该 `openid`，先插入
2. 若中心库 `user_tenant_bindings` 不存在该 `(user_id, tenant_code)`，插入绑定
3. 若发现同一 `(tenant_code, agent_id)` 已绑定到其他用户，停止并人工处理

### 8.4 迁移前检查 SQL

检查旧租户库是否存在重复 `agent_id`：

```sql
select agent_id, count(*)
from users
group by agent_id
having count(*) > 1;
```

检查中心库是否存在绑定冲突：

```sql
select tenant_code, agent_id, count(*)
from user_tenant_bindings
where unbound_at is null
group by tenant_code, agent_id
having count(*) > 1;
```

### 8.5 迁移完成后检查

```sql
select tenant_code, count(*)
from user_tenant_bindings
where unbound_at is null
group by tenant_code
order by tenant_code;
```

## 9. 切流步骤

### 9.1 后台切流

1. 确认租户 admin 域名已经指向新实例
2. 确认管理员可正常登录
3. 在代理人管理中测试生成绑定码

### 9.2 小程序切流

1. 发布小程序新版本
2. 小程序启动先访问中心 API
3. 若用户已有历史绑定，应能通过中心库恢复租户列表
4. 若用户未绑定，应进入绑定页输入绑定码

### 9.3 API 切流

1. 确认租户 API 已配置 `TENANT_CODE`
2. 确认租户 API 能访问中心库
3. 确认基于 `openid` 可解析出当前租户 `agent_id`

## 10. 验收清单

### 10.1 后台隔离

- 不同租户域名登录互不影响
- `zc-admin` 的账号不能登录 `abc-admin`
- 后台页面只能读写本租户业务库

### 10.2 中心身份

- 能查询到正确的 `tenants`
- 能生成绑定码
- 绑定码单次使用
- 绑定码过期后不可使用

### 10.3 小程序

- 无绑定时进入绑定页
- 输入绑定码后绑定成功
- 已绑定多个租户时可切换租户
- 切换租户后业务数据随租户变化

### 10.4 租户 API

- 相同 `openid` 在不同 `TENANT_CODE` 下能解析到不同 `agent_id`
- 当前租户无绑定时返回拒绝访问
- 已解绑后立即失效

## 11. 回滚策略

若迁移过程中发现严重问题，按以下顺序回滚。

### 11.1 小程序回滚

- 停止发布新版本
- 回滚到旧版本入口逻辑

### 11.2 API 回滚

- 切回旧租户 API 实例
- 恢复旧环境变量配置

### 11.3 后台回滚

- 域名切回旧后台实例

### 11.4 数据回滚原则

- 中心库中的 `tenants`、`users`、`user_tenant_bindings`、`binding_tokens` 不要直接硬删
- 优先通过停用租户、停用绑定、回退流量解决
- 需要数据回滚时，先备份再执行

## 12. 日常运维建议

- 为中心库做独立备份
- 定期清理过期 `binding_tokens`
- 新开租户时先登记 `tenants` 再部署应用
- 为历史迁移准备一次性脚本，不要手工逐条导入
- 把每个租户的 `TENANT_CODE / admin_domain / api_service_name / DB_NAME` 维护成统一台账

## 13. 新开租户最短执行路径

如果是新增一个全新租户，最短步骤如下：

1. 确保中心库已执行 `pnpm db:push:identity`
2. 执行 `pnpm --filter admin super -- tenant create ...`
3. 创建租户业务库
4. 将 `env/local/tenants/<tenant_code>/admin.env.local` 复制或软链到 `apps/admin/.env.local`
5. 将 `env/local/tenants/<tenant_code>/api.env.local` 复制或软链到 `apps/api/.env.local`
6. 执行 `pnpm db:push:business`
7. 部署该租户的 `apps/api`
8. 部署该租户的 `apps/admin`
9. 导入代理人数据
10. 创建管理员账号
11. 在后台生成绑定码，交给用户绑定

## 14. 当前实现对应的关键文件

- 中心身份 schema：`packages/domain-identity/src/db/schema.ts`
- 租户 agent schema：`packages/domain-agent/src/db/schema.ts`
- 中心 API：`apps/api-center/src/index.ts`
- 租户 API context：`apps/api/src/index.ts`
- 业务库 Drizzle 配置：`drizzle/business.config.ts`
- 中心库 Drizzle 配置：`drizzle/identity.config.ts`
- 小程序中心 API 客户端：`apps/miniprogram/src/lib/center-api.ts`
- 小程序租户缓存：`apps/miniprogram/src/lib/tenant-session.ts`
