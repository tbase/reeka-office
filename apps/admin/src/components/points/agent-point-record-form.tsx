"use client";

import { useForm } from "@tanstack/react-form";
import { useSearchParams } from "next/navigation";
import { useRef } from "react";
import { toast } from "sonner";

import type { PointItemRow } from "@reeka-office/domain-point";

import { AgentSearchSelect } from "@/components/agents/agent-search-select";
import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Textarea } from "@/components/ui/textarea";

type PointItem = Pick<PointItemRow, "id" | "name">;

function parseOptionalAgentId(value: string | null) {
  if (!value) return "";

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? String(id) : "";
}

export function AgentPointRecordForm({
  pointItems,
  searchAgentsAction,
  id,
  onSuccess,
  action,
}: {
  pointItems: PointItem[];
  searchAgentsAction: (
    input: {
      keyword?: string;
      agentId?: string;
    },
  ) => Promise<Array<{ id: number; agentCode: string | null; name: string }>>;
  id?: string;
  onSuccess?: () => void;
  action: (
    formData: FormData,
  ) =>
    | { success: true }
    | { error: string }
    | Promise<{ success: true } | { error: string }>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const initialAgentId = parseOptionalAgentId(searchParams.get("agentId"));

  const form = useForm({
    defaultValues: {
      agentId: initialAgentId,
      pointItemId: "",
      points: "",
      remark: "",
    },
    onSubmit: async ({ value: formValue }) => {
      if (!formRef.current) return;

      const formData = new FormData(formRef.current);
      formData.set("agentId", formValue.agentId);
      formData.set("pointItemId", formValue.pointItemId);
      formData.set("points", formValue.points);
      formData.set("remark", formValue.remark);

      const result = await action(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("积分已发放");
      onSuccess?.();
    },
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    await form.handleSubmit();
  };

  return (
    <form
      id={id}
      ref={formRef}
      onSubmit={handleSubmit}
      className="max-w-xl space-y-4"
    >
      <form.Field
        name="agentId"
        validators={{
          onSubmit: ({ value: v }) =>
            /^\d+$/.test(v.trim()) ? undefined : "请选择代理人",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>代理人</FieldLabel>
                <AgentSearchSelect
                  name="agentId"
                  required
                  searchAction={searchAgentsAction}
                  value={field.state.value}
                  onValueChange={(v) => field.handleChange(String(v))}
                />
              </FieldContent>
            </Field>
          );
        }}
      </form.Field>

      <form.Field
        name="pointItemId"
        validators={{
          onSubmit: ({ value: v }) => (v ? undefined : "请选择积分事项"),
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;
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
          );
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
  );
}
