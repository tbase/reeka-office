"use server"

import { CreatePointRecordCommand } from "@reeka-office/domain-point"
import { ListAgentsQuery } from "@reeka-office/domain-user"
import { revalidatePath } from "next/cache"

import { getRequiredAdminContext } from "@/lib/admin-context"
import {
  getFormDataValues,
  parseOptionalPositiveInt,
  parseOptionalText,
  parseRequiredId,
} from "@/lib/form-data"

const DEFAULT_OPERATOR_ID = 1
const AGENT_SEARCH_LIMIT = 10
const agentPointRecordFieldNames = ["agentId", "pointItemId", "points", "remark"] as const

type SearchAgentsInput = {
  keyword?: string
  agentId?: string
}

function parseAgentPointRecordInput(formData: FormData) {
  const fields = getFormDataValues(formData, agentPointRecordFieldNames)

  return {
    agentId: parseRequiredId(fields.agentId, "请选择代理人"),
    pointItemId: parseRequiredId(fields.pointItemId, "积分事项无效"),
    points: parseOptionalPositiveInt(fields.points, "积分值") ?? undefined,
    remark: parseOptionalText(fields.remark),
  }
}

export async function createAgentPointRecordAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  const ctx = await getRequiredAdminContext()
  const { agentId, pointItemId, points, remark } = parseAgentPointRecordInput(formData)

  await new CreatePointRecordCommand(ctx, {
    agentId,
    pointItemId,
    points,
    remark: remark || null,
    createdBy: DEFAULT_OPERATOR_ID,
  }).execute()

  revalidatePath("/points/agents")
  return { success: true }
}

export async function searchAgentsAction(input: SearchAgentsInput) {
  const ctx = await getRequiredAdminContext()
  const trimmedKeyword = input.keyword?.trim()
  const agentId = Number(input.agentId)

  if (Number.isInteger(agentId) && agentId > 0) {
    const agents = await new ListAgentsQuery({
      tenantId: ctx.tenantId,
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
    tenantId: ctx.tenantId,
    keyword: trimmedKeyword,
    limit: AGENT_SEARCH_LIMIT,
  }).query()

  return agents.map((agent) => ({
    id: agent.id,
    agentCode: agent.agentCode,
    name: agent.name,
  }))
}
