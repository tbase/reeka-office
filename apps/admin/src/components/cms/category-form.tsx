"use client";

import { useForm } from "@tanstack/react-form";
import { useRef } from "react";
import { toast } from "sonner";

import {
  FieldSchemaEditor,
  type FieldSchemaItem,
} from "@/components/cms/field-schema-editor";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export type CategoryFormValue = {
  id?: number;
  name?: string;
  slug?: string;
  description?: string | null;
  fieldSchema?: FieldSchemaItem[];
};

export function CategoryForm({
  action,
  value,
  id,
  onSuccess,
}: {
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>;
  value?: CategoryFormValue;
  id?: string;
  onSuccess?: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm({
    defaultValues: {
      name: value?.name ?? "",
      slug: value?.slug ?? "",
      description: value?.description ?? "",
    },
    onSubmit: async ({ value: formValue }) => {
      if (!formRef.current) return;

      const formData = new FormData(formRef.current);
      formData.set("name", formValue.name);
      formData.set("slug", formValue.slug);
      formData.set("description", formValue.description);

      if (value?.id) {
        formData.set("id", String(value.id));
      }

      const result = await action(formData);
      if (result?.success) {
        const isCreate = !value?.id;
        toast.success(isCreate ? "分类已创建" : "分类已保存");
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
          onSubmit: ({ value: fieldValue }) =>
            fieldValue.trim().length > 0 ? undefined : "分类名称不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>分类名称</FieldLabel>
                <Input
                  id={field.name}
                  name="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="分类名称"
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

      <form.Field name="slug">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>Slug</FieldLabel>
              <Input
                id={field.name}
                name="slug"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="slug（可选）"
              />
              <FieldDescription>可留空，系统将按规则处理。</FieldDescription>
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>分类描述</FieldLabel>
              <Textarea
                id={field.name}
                name="description"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="分类描述（可选）"
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <Field>
        <FieldContent>
          <FieldLabel>字段定义</FieldLabel>
          <FieldSchemaEditor
            inputName="fieldSchema"
            defaultValue={value?.fieldSchema}
          />
        </FieldContent>
      </Field>
    </form>
  );
}
