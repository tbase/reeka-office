export const dynamic = "force-dynamic"

import { ListPointItemsQuery } from "@reeka-office/domain-point"

import { AgentPointRecordForm } from "../agent-point-record-form"

const AGENT_CODE_REGEX = /^[A-Za-z0-9]{8}$/

export default async function AgentPointsCreatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const raw = typeof params.agentCode === "string" ? params.agentCode.trim().toUpperCase() : ""
  const defaultAgentCode = AGENT_CODE_REGEX.test(raw) ? raw : undefined

  const pointItems = await new ListPointItemsQuery().query()

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增代理人积分</h1>
        <p className="text-muted-foreground text-sm">发放时会校验事项年次数上限，并自动累计当前积分余额。</p>
      </div>

      <AgentPointRecordForm pointItems={pointItems} defaultAgentCode={defaultAgentCode} />
    </div>
  )
}
