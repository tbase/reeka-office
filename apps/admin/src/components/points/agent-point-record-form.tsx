"use client"

import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSearchParams } from "next/navigation"
import { Controller } from "react-hook-form"
import { toast } from "sonner"

import type { PointItemRow } from "@reeka-office/domain-point"

import type {
  CreateAgentPointRecordAction,
  SearchAgentsAction,
} from "@/actions/points/agent-actions"
import { createAgentPointRecordActionSchema } from "@/actions/points/form-schemas"
import { AgentSearchSelect } from "@/components/agents/agent-search-select"
import {
  getErrorMessage,
  getFieldError,
  getFormError,
} from "@/components/points/form-errors"
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { SimpleSelect } from "@/components/ui/simple-select"
import { Textarea } from "@/components/ui/textarea"

type PointItem = Pick<PointItemRow, "id" | "name">

function parseOptionalAgentId(value: string | null) {
  if (!value) return "";

  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? String(id) : ""
}

function normalizeOptionalNumberInput(value: unknown) {
  if (typeof value !== "string") {
    return value
  }

  const trimmed = value.trim()
  return trimmed ? Number(trimmed) : undefined
}

export function AgentPointRecordForm({
  pointItems,
  searchAgentsAction,
  id,
  onSuccess,
  action,
}: {
  pointItems: PointItem[]
  searchAgentsAction: SearchAgentsAction
  id?: string
  onSuccess?: () => void
  action: CreateAgentPointRecordAction
}) {
  const searchParams = useSearchParams()
  const initialAgentId = parseOptionalAgentId(searchParams.get("agentId"))

  const { form, action: actionState, handleSubmitWithAction } = useHookFormAction(
    action as never,
    zodResolver(createAgentPointRecordActionSchema),
    {
      formProps: {
        defaultValues: {
          agentId: initialAgentId ? Number(initialAgentId) : undefined,
          pointItemId: undefined,
          points: undefined,
          remark: "",
        },
      },
      actionProps: {
        onSuccess: () => {
          toast.success("积分已发放")
          onSuccess?.()
        },
        onError: ({ error }) => {
          const serverError = getErrorMessage(error.serverError)
          if (serverError) {
            toast.error(serverError)
          }
        },
      },
    },
  )

  const formError =
    getErrorMessage(actionState.result.serverError) ??
    getFormError(actionState.result.validationErrors)

  return (
    <form id={id} onSubmit={handleSubmitWithAction} className="max-w-xl space-y-4">
      {formError ? (
        <Field data-invalid>
          <FieldContent>
            <FieldError>{formError}</FieldError>
          </FieldContent>
        </Field>
      ) : null}

      <Field
        data-invalid={
          Boolean(form.formState.errors.agentId) ||
          Boolean(getFieldError(actionState.result.validationErrors, "agentId")) ||
          undefined
        }
      >
        <FieldContent>
          <FieldLabel>代理人</FieldLabel>
          <Controller
            control={form.control}
            name="agentId"
            render={({ field }) => (
              <AgentSearchSelect
                name="agentId"
                required
                searchAction={searchAgentsAction}
                value={field.value ? String(field.value) : ""}
                onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
              />
            )}
          />
          <FieldError>
            {getErrorMessage(form.formState.errors.agentId?.message) ??
              getFieldError(actionState.result.validationErrors, "agentId") ??
              null}
          </FieldError>
        </FieldContent>
      </Field>

      <Field
        data-invalid={
          Boolean(form.formState.errors.pointItemId) ||
          Boolean(getFieldError(actionState.result.validationErrors, "pointItemId")) ||
          undefined
        }
      >
        <FieldContent>
          <FieldLabel>积分事项</FieldLabel>
          <Controller
            control={form.control}
            name="pointItemId"
            render={({ field }) => (
              <SimpleSelect
                required
                placeholder={
                  pointItems.length === 0 ? "暂无积分事项" : "请选择积分事项"
                }
                items={pointItems.map((item) => ({
                  value: String(item.id),
                  label: item.name,
                }))}
                value={field.value ? String(field.value) : ""}
                onValueChange={(value) => field.onChange(value ? Number(value) : undefined)}
              />
            )}
          />
          <FieldError>
            {getErrorMessage(form.formState.errors.pointItemId?.message) ??
              getFieldError(actionState.result.validationErrors, "pointItemId") ??
              null}
          </FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.points) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="points">积分值（可选）</FieldLabel>
          <Input
            id="points"
            type="number"
            min={1}
            step={1}
            placeholder="留空则使用事项默认积分"
            {...form.register("points", {
              setValueAs: normalizeOptionalNumberInput,
            })}
          />
          <FieldError>{getErrorMessage(form.formState.errors.points?.message) ?? null}</FieldError>
        </FieldContent>
      </Field>

      <Field>
        <FieldContent>
          <FieldLabel htmlFor="remark">备注（可选）</FieldLabel>
          <Textarea
            id="remark"
            rows={2}
            placeholder="填写积分发放说明"
            {...form.register("remark")}
          />
        </FieldContent>
      </Field>
    </form>
  )
}
