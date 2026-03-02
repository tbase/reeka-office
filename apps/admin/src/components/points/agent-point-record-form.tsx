"use client"

import { useForm } from "@tanstack/react-form"
import { useRef } from "react"
import { toast } from "sonner"

import type { PointItemRow } from "@reeka-office/domain-point"
import type { Agent } from "@reeka-office/domain-user"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SimpleSelect } from "@/components/ui/simple-select"
import { Textarea } from "@/components/ui/textarea"

type PointItem = Pick<PointItemRow, "id" | "name">
type AgentOption = Pick<Agent, "agentCode" | "name">

export function AgentPointRecordForm({
  pointItems,
  agents,
  defaultAgentCode,
  id,
  onSuccess,
  action,
}: {
  pointItems: PointItem[]
  agents: AgentOption[]
  defaultAgentCode?: string
  id?: string
  onSuccess?: () => void
  action: (
    formData: FormData,
  ) =>
    | { success: true }
    | { error: string }
    | Promise<{ success: true } | { error: string }>
}) {
  const formRef = useRef<HTMLFormElement>(null)

  const form = useForm({
    defaultValues: {
      agentCode: defaultAgentCode ?? "",
      pointItemId: "",
      points: "",
      remark: "",
    },
    onSubmit: async ({ value: formValue }) => {
      if (!formRef.current) return

      const formData = new FormData(formRef.current)
      formData.set("agentCode", formValue.agentCode)
      formData.set("pointItemId", formValue.pointItemId)
      formData.set("points", formValue.points)
      formData.set("remark", formValue.remark)

      const result = await action(formData)
      if ("error" in result) {
        toast.error(result.error)
        return
      }
      toast.success("积分已发放")
      onSuccess?.()
    },
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()
    await form.handleSubmit()
  }

  return (
    <form
      id={id}
      ref={formRef}
      onSubmit={handleSubmit}
      className="max-w-xl space-y-4"
    >
      <form.Field
        name="agentCode"
        validators={{
          onSubmit: ({ value: v }) =>
            /^[A-Za-z0-9]{8}$/.test(v.trim())
              ? undefined
              : "代理人编码必须为 8 位字母或数字",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>代理人编码</FieldLabel>
                <SimpleSelect
                  name="agentCode"
                  required
                  placeholder={
                    agents.length === 0 ? "暂无代理人" : "请选择代理人"
                  }
                  items={agents.map((agent) => ({
                    value: agent.agentCode,
                    label: `${agent.agentCode} - ${agent.name}`,
                  }))}
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(String(v).toUpperCase())}
                />
              </FieldContent>
            </Field>
          )
        }}
      </form.Field>

      <form.Field
        name="pointItemId"
        validators={{
          onSubmit: ({ value: v }) =>
            v ? undefined : "请选择积分事项",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel>积分事项</FieldLabel>
                <SimpleSelect
                  name="pointItemId"
                  required
                  placeholder={
                    pointItems.length === 0 ? "暂无积分事项" : "请选择积分事项"
                  }
                  items={pointItems.map((item) => ({
                    value: String(item.id),
                    label: item.name,
                  }))}
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(String(v))}
                />
              </FieldContent>
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="points">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>积分值（可选）</FieldLabel>
              <Input
                id={field.name}
                name="points"
                type="number"
                min={1}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="留空则使用事项默认积分"
              />
              <FieldDescription>事项未配置默认积分时必填。</FieldDescription>
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="remark">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>备注（可选）</FieldLabel>
              <Textarea
                id={field.name}
                name="remark"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                rows={2}
                placeholder="填写积分发放说明"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>
    </form>
  )
}
