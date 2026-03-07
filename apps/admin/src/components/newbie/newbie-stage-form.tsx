"use client";

import { useForm } from "@tanstack/react-form";
import { useRef } from "react";
import { toast } from "sonner";

import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type NewbieStageFormValue = {
  id?: number;
  stage?: string;
  title?: string;
  description?: string | null;
};

export function NewbieStageForm({
  action,
  value,
  id,
  onSuccess,
}: {
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>;
  value?: NewbieStageFormValue;
  id?: string;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm({
    defaultValues: {
      stage: value?.stage ?? "",
      title: value?.title ?? "",
      description: value?.description ?? "",
    },
    onSubmit: async ({ value: formValue }) => {
      if (!formRef.current) {
        return;
      }

      const formData = new FormData(formRef.current);
      formData.set("stage", formValue.stage);
      formData.set("title", formValue.title);
      formData.set("description", formValue.description);

      if (value?.id) {
        formData.set("id", String(value.id));
      }

      const result = await action(formData);
      if (result?.success) {
        const isCreate = !value?.id;
        toast.success(isCreate ? "任务阶段已创建" : "任务阶段已保存");
        onSuccess?.();
      }
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
      {value?.id ? (
        <input type="hidden" name="id" value={String(value.id)} />
      ) : null}

      <form.Field
        name="stage"
        validators={{
          onSubmit: ({ value: v }) =>
            v.trim().length > 0 ? undefined : "阶段标识不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>阶段标识</FieldLabel>
                <Input
                  id={field.name}
                  name="stage"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="例如：W01"
                  required
                />
                <FieldError>
                  {hasError ? String(field.state.meta.errors[0]) : null}
                </FieldError>
              </FieldContent>
            </Field>
          );
        }}
      </form.Field>

      <form.Field
        name="title"
        validators={{
          onSubmit: ({ value: v }) =>
            v.trim().length > 0 ? undefined : "阶段名称不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>阶段名称</FieldLabel>
                <Input
                  id={field.name}
                  name="title"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="例如：入门阶段"
                  required
                />
                <FieldError>
                  {hasError ? String(field.state.meta.errors[0]) : null}
                </FieldError>
              </FieldContent>
            </Field>
          );
        }}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>阶段说明</FieldLabel>
              <Textarea
                id={field.name}
                name="description"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="可选，填写该阶段的任务目标说明"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>
    </form>
  );
}
