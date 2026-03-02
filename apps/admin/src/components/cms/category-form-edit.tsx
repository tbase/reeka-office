"use client";

import type { FieldSchemaItem } from "@reeka-office/domain-cms";

import { CategoryForm } from "./category-form";

export type CategoryFormEditValue = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  hideContent?: boolean;
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
