"use server"

import { revalidatePath } from "next/cache"

import { ListAgentsQuery } from "@reeka-office/domain-agent"
import { CreatePointRecordCommand } from "@reeka-office/domain-point"

import {
  createAgentPointRecordActionSchema,
  type SearchAgentsActionInput,
} from "@/actions/points/form-schemas"
import { getRequiredAdminContext } from "@/lib/admin-context"
import { adminActionClient } from "@/lib/safe-action"

const DEFAULT_OPERATOR_ID = 1
const AGENT_SEARCH_LIMIT = 10

export const createAgentPointRecordAction = adminActionClient
  .inputSchema(createAgentPointRecordActionSchema)
  .action(async ({ parsedInput }) => {
    await new CreatePointRecordCommand({
      agentId: parsedInput.agentId,
      pointItemId: parsedInput.pointItemId,
      remark: parsedInput.remark,
      createdBy: DEFAULT_OPERATOR_ID,
    }).execute()

    revalidatePath("/points/agents")
    return { success: true }
  })

export type CreateAgentPointRecordAction = typeof createAgentPointRecordAction

export async function searchAgentsAction(input: SearchAgentsActionInput) {
  await getRequiredAdminContext()

  const trimmedKeyword = input.keyword?.trim()
  const agentId = Number(input.agentId)

  if (Number.isInteger(agentId) && agentId > 0) {
    const agents = await new ListAgentsQuery({
      agentId,
      limit: 1,
    }).query()

    return agents.map((agent) => ({
      id: agent.id,
      agentCode: agent.agentCode,
      name: agent.name,
    }))
  }

  if (!trimmedKeyword) {
    return []
  }

  const agents = await new ListAgentsQuery({
    keyword: trimmedKeyword,
    limit: AGENT_SEARCH_LIMIT,
  }).query()

  return agents.map((agent) => ({
    id: agent.id,
    agentCode: agent.agentCode,
    name: agent.name,
  }))
}

export type SearchAgentsAction = typeof searchAgentsAction
