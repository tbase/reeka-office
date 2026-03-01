"use client";

import type { FieldSchemaItem } from "@/components/cms/field-schema-editor";

import { CategoryForm } from "./category-form";

export type CategoryFormEditValue = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  fieldSchema: FieldSchemaItem[];
};

export function CategoryFormEdit({
  id,
  value,
  action,
  onSuccess,
}: {
  id: string;
  value: CategoryFormEditValue;
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>;
  onSuccess?: () => void;
}) {
  return (
    <CategoryForm
      action={action}
      id={id}
      value={value}
      onSuccess={onSuccess}
    />
  );
}
