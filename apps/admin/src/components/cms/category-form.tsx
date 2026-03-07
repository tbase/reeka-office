"use client";

import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

import type { FieldSchemaItem } from "@reeka-office/domain-cms";

import type { CategoryActionInput } from "@/app/(console)/cms/categories/actions";
import { FieldSchemaEditor } from "@/components/cms/field-schema-editor";
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
  hideContent?: boolean;
  fieldSchema?: FieldSchemaItem[];
};

export function CategoryForm({
  action,
  value,
  id,
  onSuccess,
}: {
  action: (
    data: CategoryActionInput,
  ) => { success: true } | void | Promise<{ success: true } | void>;
  value?: CategoryFormValue;
  id?: string;
  onSuccess?: () => void;
}) {
  const form = useForm({
    defaultValues: {
      name: value?.name ?? "",
      slug: value?.slug ?? "",
      description: value?.description ?? "",
      hideContent: value?.hideContent ?? false,
      fieldSchema: value?.fieldSchema ?? ([] as FieldSchemaItem[]),
    },
    onSubmit: async ({ value: formValue }) => {
      const result = await action({
        id: value?.id,
        name: formValue.name,
        slug: formValue.slug,
        description: formValue.description,
        hideContent: formValue.hideContent,
        fieldSchema: formValue.fieldSchema,
      });
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
    <form id={id} onSubmit={handleSubmit} className="space-y-4">
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

      <form.Field name="hideContent">
        {(field) => (
          <Field>
            <FieldContent>
              <label className="flex h-9 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm">
                <input
                  type="checkbox"
                  name="hideContent"
                  checked={field.state.value}
                  onChange={(e) => field.handleChange(e.target.checked)}
                />
                <span>隐藏正文</span>
              </label>
              <FieldDescription>
                开启后，编辑该分类下的内容时不显示正文字段。
              </FieldDescription>
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <form.Field name="fieldSchema">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel>字段定义</FieldLabel>
              <FieldSchemaEditor
                defaultValue={field.state.value}
                onChange={(items) => field.handleChange(items)}
              />
            </FieldContent>
          </Field>
        )}
      </form.Field>
    </form>
  );
}
