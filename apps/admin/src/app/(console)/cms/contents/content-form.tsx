"use client";

import { useForm } from "@tanstack/react-form";
import { useMemo, useRef, useState } from "react";

import {
  buildFieldsState,
  CategoryOption,
  ContentFields,
  normalizeFieldValue,
} from "@/components/cms/content-fields";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { LinkButton } from "@/components/ui/link-button";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Textarea } from "@/components/ui/textarea";

type ContentFormValue = {
  id?: number;
  name?: string;
  content?: string;
  categoryId?: number;
  fields?: Record<string, unknown>;
};

export function ContentForm({
  action,
  categories,
  submitLabel,
  cancelHref,
  value,
}: {
  action: (formData: FormData) => void | Promise<void>;
  categories: CategoryOption[];
  submitLabel: string;
  cancelHref: string;
  value?: ContentFormValue;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialCategory =
    categories.find((c) => c.id === value?.categoryId) ?? categories[0];

  const [categoryId, setCategoryId] = useState<number | undefined>(
    initialCategory?.id,
  );
  const [fieldsByCategory, setFieldsByCategory] = useState<
    Record<number, Record<string, unknown>>
  >(() => {
    if (!initialCategory) return {};
    return {
      [initialCategory.id]: buildFieldsState(
        initialCategory.fieldSchema,
        value?.fields,
      ),
    };
  });

  const selectedCategory = useMemo(
    () => categories.find((c) => c.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const fields = useMemo(() => {
    if (!selectedCategory || !categoryId) return {};
    return buildFieldsState(
      selectedCategory.fieldSchema,
      fieldsByCategory[categoryId],
    );
  }, [categoryId, fieldsByCategory, selectedCategory]);

  const serializedFields = useMemo(() => JSON.stringify(fields), [fields]);

  const updateField = (fieldName: string, fieldValue: unknown) => {
    if (!categoryId) return;
    setFieldsByCategory((current) => ({
      ...current,
      [categoryId]: {
        ...buildFieldsState(
          selectedCategory?.fieldSchema ?? [],
          current[categoryId],
        ),
        [fieldName]: normalizeFieldValue(
          selectedCategory?.fieldSchema.find((f) => f.name === fieldName) ?? {
            name: fieldName,
            label: fieldName,
            type: "text",
          },
          fieldValue,
        ),
      },
    }));
  };

  const form = useForm({
    defaultValues: {
      name: value?.name ?? "",
      content: value?.content ?? "",
    },
    onSubmit: async ({ value: formValue }) => {
      if (!formRef.current) return;

      const formData = new FormData(formRef.current);
      formData.set("name", formValue.name);
      formData.set("content", formValue.content);

      if (value?.id) {
        formData.set("id", String(value.id));
      }

      await action(formData);
    },
  });

  const handleSubmit = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    setIsSubmitting(true);
    try {
      await form.handleSubmit();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="max-w-xl space-y-4">
      {value?.id ? (
        <input type="hidden" name="id" value={String(value.id)} />
      ) : null}
      <input type="hidden" name="fieldsJson" value={serializedFields} />

      <Field>
        <FieldContent>
          <FieldLabel>分类</FieldLabel>
          <SimpleSelect
            name="categoryId"
            required
            placeholder={categories.length === 0 ? "暂无分类" : "请选择分类"}
            items={categories.map((c) => ({ value: String(c.id), label: c.name }))}
            value={categoryId ? String(categoryId) : ""}
            onValueChange={(nextValue) => {
              const nextId = Number(nextValue);
              const nextCategory = categories.find((c) => c.id === nextId);
              setCategoryId(nextId);
              if (nextCategory) {
                setFieldsByCategory((current) => {
                  if (current[nextId]) return current;
                  return {
                    ...current,
                    [nextId]: buildFieldsState(nextCategory.fieldSchema),
                  };
                });
              }
            }}
          />
        </FieldContent>
      </Field>

      <form.Field
        name="name"
        validators={{
          onSubmit: ({ value: fieldValue }) =>
            fieldValue.trim().length > 0 ? undefined : "内容名称不能为空",
        }}
      >
        {(field) => {
          const hasError = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={hasError || undefined}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>内容名称</FieldLabel>
                <Input
                  id={field.name}
                  name="name"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(event) => field.handleChange(event.target.value)}
                  placeholder="内容名称"
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

      <form.Field name="content">
        {(field) => (
          <Field>
            <FieldContent>
              <FieldLabel htmlFor={field.name}>正文</FieldLabel>
              <Textarea
                id={field.name}
                name="content"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(event) => field.handleChange(event.target.value)}
                placeholder="正文"
                rows={4}
              />
              <FieldDescription>支持纯文本录入，可留空。</FieldDescription>
            </FieldContent>
          </Field>
        )}
      </form.Field>

      <ContentFields
        category={selectedCategory}
        fields={fields}
        onUpdateField={updateField}
      />

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={isSubmitting || categories.length === 0}
        >
          {submitLabel}
        </Button>
        <LinkButton href={cancelHref} variant="ghost">
          取消
        </LinkButton>
      </div>
    </form>
  );
}
