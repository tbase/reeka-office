export const dynamic = "force-dynamic"

import { ListPointItemsQuery } from "@reeka-office/domain-point"

import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"
import { AgentPointRecordForm } from "@/components/points/agent-point-record-form"

import { createAgentPointRecordAction } from "../actions"

const AGENT_CODE_REGEX = /^[A-Za-z0-9]{8}$/

function parseOptionalAgentCode(value: string | undefined): string | undefined {
  if (!value) return undefined
  const code = value.trim().toUpperCase()
  return AGENT_CODE_REGEX.test(code) ? code : undefined
}

export default async function AgentPointsCreatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const defaultAgentCode = parseOptionalAgentCode(
    typeof params.agentCode === "string" ? params.agentCode : undefined,
  )

  const pointItems = await new ListPointItemsQuery().query()

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增代理人积分</h1>
        <p className="text-muted-foreground text-sm">
          发放时会校验事项年次数上限，并自动累计当前积分余额。
        </p>
      </div>

      <AgentPointRecordForm
        action={createAgentPointRecordAction}
        id="agent-point-record-form"
        pointItems={pointItems}
        defaultAgentCode={defaultAgentCode}
      />

      <div className="flex gap-2">
        <Button
          type="submit"
          form="agent-point-record-form"
          disabled={pointItems.length === 0}
        >
          发放积分
        </Button>
        <LinkButton href="/points/agents" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
