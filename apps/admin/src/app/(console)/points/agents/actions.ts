"use server"

import { CreatePointRecordCommand } from "@reeka-office/domain-point"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

const DEFAULT_OPERATOR_ID = 1
const AGENT_CODE_REGEX = /^[A-Za-z0-9]{8}$/

function isNextInternalError(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as Record<string, unknown>).digest === "string"
  )
}

function parseAgentCode(value: FormDataEntryValue | null): string {
  const code = String(value ?? "").trim().toUpperCase()
  if (!AGENT_CODE_REGEX.test(code)) {
    throw new Error("代理人编码必须为 8 位字母或数字")
  }
  return code
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
): Promise<{ error: string } | null> {
  try {
    const agentCode = parseAgentCode(formData.get("agentCode"))
    const pointItemId = parseId(formData.get("pointItemId"), "积分事项")
    const points = parseOptionalPositiveInt(formData.get("points"), "积分值")
    const remark = String(formData.get("remark") ?? "").trim()

    await new CreatePointRecordCommand({
      agentCode,
      pointItemId,
      points,
      remark: remark || null,
      createdBy: DEFAULT_OPERATOR_ID,
    }).execute()

    revalidatePath("/points/agents")
    redirect(`/points/agents?agentCode=${agentCode}`)
  } catch (e) {
    if (isNextInternalError(e)) throw e
    return { error: e instanceof Error ? e.message : "操作失败，请重试" }
  }

  return null
}
