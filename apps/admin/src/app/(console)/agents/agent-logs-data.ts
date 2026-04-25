import {
  GetAgentByCodeQuery,
  ListAgentLogsQuery,
} from "@reeka-office/domain-agent"
import { notFound } from "next/navigation"

import { getRequiredAdminContext } from "@/lib/admin-context"

import {
  parseAgentLogsSearchParams,
  type AgentLogsSearchParams,
  type SearchParamsRecord,
} from "./search-params"

export interface AgentLogsPageData {
  agent: NonNullable<Awaited<ReturnType<GetAgentByCodeQuery["query"]>>>
  filters: AgentLogsSearchParams
  logs: Awaited<ReturnType<ListAgentLogsQuery["query"]>>
}

export async function getAgentLogsPageData({
  agentCode,
  searchParams,
}: {
  agentCode: string
  searchParams: SearchParamsRecord
}): Promise<AgentLogsPageData> {
  const normalizedAgentCode = agentCode.trim()
  if (!normalizedAgentCode) {
    notFound()
  }

  await getRequiredAdminContext()

  const filters = parseAgentLogsSearchParams(searchParams)
  const [agent, logs] = await Promise.all([
    new GetAgentByCodeQuery({
      agentCode: normalizedAgentCode,
    }).query(),
    new ListAgentLogsQuery({
      agentCode: normalizedAgentCode,
      category: filters.category === "all" ? undefined : filters.category,
      month: filters.month,
    }).query(),
  ])

  if (!agent) {
    notFound()
  }

  return {
    agent,
    filters,
    logs,
  }
}
