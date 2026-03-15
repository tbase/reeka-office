"use server"

import { CreatePointRecordCommand } from "@reeka-office/domain-point"
import { revalidatePath } from "next/cache"

const DEFAULT_OPERATOR_ID = 1

function isNextInternalError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as Record<string, unknown>).digest === "string"
  )
}

function parseAgentId(value: FormDataEntryValue | null): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("请选择代理人")
  }
  return id
}

function parseId(value: FormDataEntryValue | null, label: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(`${label}无效`)
  }
  return id
}

function parseOptionalPositiveInt(value: FormDataEntryValue | null, label: string): number | undefined {
  const raw = String(value ?? "").trim()
  if (!raw) {
    return undefined
  }

  const num = Number(raw)
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`${label}必须为正整数`)
  }

  return num
}

export async function createAgentPointRecordAction(
  formData: FormData,
): Promise<{ success: true } | { error: string }> {
  try {
    const agentId = parseAgentId(formData.get("agentId"))
    const pointItemId = parseId(formData.get("pointItemId"), "积分事项")
    const points = parseOptionalPositiveInt(formData.get("points"), "积分值")
    const remark = String(formData.get("remark") ?? "").trim()

    await new CreatePointRecordCommand({
      agentId,
      pointItemId,
      points,
      remark: remark || null,
      createdBy: DEFAULT_OPERATOR_ID,
    }).execute()

    revalidatePath("/points/agents")
    return { success: true }
  } catch (e) {
    if (isNextInternalError(e)) throw e
    return { error: e instanceof Error ? e.message : "操作失败，请重试" }
  }
}
