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

export type PointItemFormValue = {
  id?: number;
  name?: string;
  category?: string;
  pointAmount?: number | null;
  annualLimit?: number | null;
};

export function PointItemForm({
  action,
  value,
  id,
  onSuccess,
}: {
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>;
  value?: PointItemFormValue;
  id?: string;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm({
    defaultValues: {
      name: value?.name ?? "",
      category: value?.category ?? "",
      pointAmount: value?.pointAmount != null ? String(value.pointAmount) : "",
      annualLimit: value?.annualLimit != null ? String(value.annualLimit) : "",
    },
    onSubmit: async ({ value: formValue }) => {
      if (!formRef.current) return;

      const formData = new FormData(formRef.current);
      formData.set("name", formValue.name);
      formData.set("category", formValue.category);
      formData.set("pointAmount", formValue.pointAmount);
      formData.set("annualLimit", formValue.annualLimit);

      if (value?.id) {
        formData.set("id", String(value.id));
      }

      const result = await action(formData);
      if (result?.success) {
        const isCreate = !value?.id;
        toast.success(isCreate ? "积分事项已创建" : "积分事项已保存");
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
        name="name"
        validators={{
          onSubmit: ({ value: v }) =>
            v.trim().length > 0 ? undefined : "事项名称不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>事项名称</FieldLabel>
                <Input
                  id={field.name}
                  name="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="例如：新人招募"
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
        name="category"
        validators={{
          onSubmit: ({ value: v }) =>
            v.trim().length > 0 ? undefined : "事项类别不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>事项类别</FieldLabel>
                <Input
                  id={field.name}
                  name="category"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="例如：招募"
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

      <form.Field name="pointAmount">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>积分金额</FieldLabel>
              <Input
                id={field.name}
                name="pointAmount"
                type="number"
                min={1}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="留空表示发放时手填"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="annualLimit">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>每年次数上限</FieldLabel>
              <Input
                id={field.name}
                name="annualLimit"
                type="number"
                min={1}
                step={1}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="留空表示不限"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>
    </form>
  );
}
