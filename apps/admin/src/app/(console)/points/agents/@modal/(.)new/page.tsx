import { ListPointItemsQuery } from "@reeka-office/domain-point"

import { AgentPointRecordFormDialog } from "./form-dialog"

const AGENT_CODE_REGEX = /^[A-Za-z0-9]{8}$/

function parseOptionalAgentCode(value: string | undefined): string | undefined {
  if (!value) return undefined
  const code = value.trim().toUpperCase()
  return AGENT_CODE_REGEX.test(code) ? code : undefined
}

export default async function AgentPointRecordNewModal({
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
    <AgentPointRecordFormDialog
      pointItems={pointItems}
      defaultAgentCode={defaultAgentCode}
    />
  )
}
