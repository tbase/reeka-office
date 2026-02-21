"use client"

import { useActionState } from "react"

import type { PointItemRow } from "@reeka-office/domain-point"

import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { LinkButton } from "@/components/ui/link-button"
import { SimpleSelect } from "@/components/ui/simple-select"
import { SubmitButton } from "@/components/ui/submit-button"
import { Textarea } from "@/components/ui/textarea"

import { createAgentPointRecordAction } from "./actions"

type PointItem = Pick<PointItemRow, "id" | "name">

async function handleAction(_prev: string | null, formData: FormData): Promise<string | null> {
  const result = await createAgentPointRecordAction(formData)
  return result?.error ?? null
}

export function AgentPointRecordForm({
  pointItems,
  defaultAgentCode,
}: {
  pointItems: PointItem[]
  defaultAgentCode?: string
}) {
  const [error, formAction] = useActionState(handleAction, null)

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      {error && (
        <p className="text-destructive border-destructive/30 bg-destructive/5 rounded-md border px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="agentCode">代理人编码</FieldLabel>
          <Input
            id="agentCode"
            name="agentCode"
            placeholder="例如 A1234567"
            defaultValue={defaultAgentCode}
            maxLength={8}
            required
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel>积分事项</FieldLabel>
          <SimpleSelect
            name="pointItemId"
            required
            placeholder="请选择积分事项"
            items={pointItems.map((item) => ({ value: String(item.id), label: item.name }))}
          />
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="points">积分值（可选）</FieldLabel>
          <Input
            id="points"
            name="points"
            type="number"
            min={1}
            step={1}
            placeholder="留空则使用事项默认积分"
          />
          <FieldDescription>事项未配置默认积分时必填。</FieldDescription>
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="remark">备注（可选）</FieldLabel>
          <Textarea id="remark" name="remark" rows={2} placeholder="填写积分发放说明" />
        </FieldContent>
      </Field>

      <div className="flex gap-2">
        <SubmitButton disabled={pointItems.length === 0}>发放积分</SubmitButton>
        <LinkButton href="/points/agents" variant="outline">
          返回列表
        </LinkButton>
      </div>
    </form>
  )
}
