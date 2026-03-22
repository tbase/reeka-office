"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useHookFormAction } from "@next-safe-action/adapter-react-hook-form/hooks";
import { useMemo, useRef } from "react";
import { useWatch } from "react-hook-form";
import { toast } from "sonner";
import type { ZodType } from "zod";

import type { ContentFormAction } from "@/actions/cms/content-actions";
import {
  buildFieldsState,
  CategoryOption,
  ContentFields,
  normalizeFieldValue,
} from "@/components/cms/content-fields";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Textarea } from "@/components/ui/textarea";

type ContentFormValue = {
  id?: number;
  name?: string;
  content?: string;
  categoryId?: number;
  fields?: Record<string, unknown>;
};

function getFieldError(validationErrors: unknown, fieldName: string) {
  if (!validationErrors || typeof validationErrors !== "object") {
    return undefined;
  }

  const fieldError = (validationErrors as Record<string, unknown>)[fieldName];
  if (
    !fieldError ||
    typeof fieldError !== "object" ||
    Array.isArray(fieldError)
  ) {
    return undefined;
  }

  const errors = (fieldError as { _errors?: unknown })._errors;
  return Array.isArray(errors) && typeof errors[0] === "string"
    ? errors[0]
    : undefined;
}

function getFormError(validationErrors: unknown) {
  if (!validationErrors || typeof validationErrors !== "object") {
    return undefined;
  }

  const errors = (validationErrors as { _errors?: unknown })._errors;
  return Array.isArray(errors) && typeof errors[0] === "string"
    ? errors[0]
    : undefined;
}

function getErrorMessage(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

export function ContentForm<
  TAction extends ContentFormAction,
  TSchema extends ZodType,
>({
  action,
  schema,
  categories,
  value,
  id,
  onSuccess,
}: {
  action: TAction;
  schema: TSchema;
  categories: CategoryOption[];
  value?: ContentFormValue;
  id?: string;
  onSuccess?: () => void;
}) {
  const initialCategory =
    categories.find((category) => category.id === value?.categoryId) ??
    categories[0] ??
    null;

  const fieldsCacheRef = useRef<Record<number, Record<string, unknown>>>(
    initialCategory
      ? {
          [initialCategory.id]: buildFieldsState(
            initialCategory.fieldSchema,
            value?.fields,
          ),
        }
      : {},
  );

  const {
    form,
    action: actionState,
    handleSubmitWithAction,
  } = useHookFormAction(action as never, zodResolver(schema as never), {
    formProps: {
      defaultValues: {
        id: value?.id,
        categoryId: initialCategory?.id ?? 0,
        name: value?.name ?? "",
        content: value?.content ?? "",
        fields: initialCategory
          ? buildFieldsState(initialCategory.fieldSchema, value?.fields)
          : {},
      },
    },
    actionProps: {
      onSuccess: () => {
        const isCreate = !value?.id;
        toast.success(isCreate ? "内容已创建" : "内容已保存");
        onSuccess?.();
      },
      onError: ({ error }) => {
        const serverError = getErrorMessage(error.serverError);
        if (serverError) {
          toast.error(serverError);
        }
      },
    },
  });

  const categoryId = useWatch({
    control: form.control,
    name: "categoryId",
  });
  const fields =
    useWatch({
      control: form.control,
      name: "fields",
    }) ?? {};

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === categoryId) ?? null,
    [categories, categoryId],
  );

  const handleCategoryChange = (nextValue: unknown) => {
    if (categoryId > 0) {
      fieldsCacheRef.current[categoryId] = buildFieldsState(
        selectedCategory?.fieldSchema ?? [],
        fields,
      );
    }

    const nextId = typeof nextValue === "string" ? Number(nextValue) : NaN;
    if (!Number.isInteger(nextId) || nextId <= 0) {
      form.setValue("categoryId", 0, {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("fields", {}, { shouldDirty: true });
      return;
    }

    const nextCategory = categories.find((category) => category.id === nextId);
    const nextFields = nextCategory
      ? buildFieldsState(
          nextCategory.fieldSchema,
          fieldsCacheRef.current[nextId],
        )
      : {};

    if (nextCategory) {
      fieldsCacheRef.current[nextId] = nextFields;
    }

    form.setValue("categoryId", nextId, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("fields", nextFields, { shouldDirty: true });
  };

  const updateField = (fieldName: string, fieldValue: unknown) => {
    const schemaField = selectedCategory?.fieldSchema.find(
      (field) => field.name === fieldName,
    ) ?? {
      name: fieldName,
      label: fieldName,
      type: "text" as const,
    };

    const nextFields = {
      ...fields,
      [fieldName]: normalizeFieldValue(schemaField, fieldValue),
    };

    if (categoryId > 0) {
      fieldsCacheRef.current[categoryId] = nextFields;
    }

    form.setValue("fields", nextFields, { shouldDirty: true });
  };

  const formError =
    getErrorMessage(actionState.result.serverError) ??
    getFormError(actionState.result.validationErrors) ??
    getFieldError(actionState.result.validationErrors, "id");

  return (
    <form
      id={id}
      onSubmit={handleSubmitWithAction}
      className="max-w-xl space-y-4"
    >
      {formError ? (
        <Field data-invalid>
          <FieldContent>
            <FieldError>{formError}</FieldError>
          </FieldContent>
        </Field>
      ) : null}

      <Field
        data-invalid={Boolean(form.formState.errors.categoryId) || undefined}
      >
        <FieldContent>
          <FieldLabel>分类</FieldLabel>
          <SimpleSelect
            required
            placeholder={categories.length === 0 ? "暂无分类" : "请选择分类"}
            items={categories.map((category) => ({
              value: String(category.id),
              label: category.name,
            }))}
            value={categoryId > 0 ? String(categoryId) : ""}
            onValueChange={handleCategoryChange}
          />
          <FieldError>
            {getErrorMessage(form.formState.errors.categoryId?.message) ?? null}
          </FieldError>
        </FieldContent>
      </Field>

      <Field data-invalid={Boolean(form.formState.errors.name) || undefined}>
        <FieldContent>
          <FieldLabel htmlFor="name">标题</FieldLabel>
          <Input
            id="name"
            placeholder="标题"
            required
            {...form.register("name")}
          />
          <FieldError>
            {getErrorMessage(form.formState.errors.name?.message) ?? null}
          </FieldError>
        </FieldContent>
      </Field>

      {!selectedCategory?.hideContent ? (
        <Field>
          <FieldContent>
            <FieldLabel htmlFor="content">正文</FieldLabel>
            <Textarea
              id="content"
              placeholder="正文"
              rows={4}
              {...form.register("content")}
            />
          </FieldContent>
        </Field>
      ) : null}

      <ContentFields
        category={selectedCategory}
        fields={fields}
        onUpdateField={updateField}
      />
    </form>
  );
}
