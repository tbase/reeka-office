"use client";

import type { FieldSchemaItem } from "@reeka-office/domain-cms";

import type { UpdateCategoryAction } from "@/actions/cms/category-actions";
import { updateCategoryActionSchema } from "@/actions/cms/form-schemas";

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
  action: UpdateCategoryAction;
  onSuccess?: () => void;
}) {
  return (
    <CategoryForm
      action={action}
      schema={updateCategoryActionSchema}
      id={id}
      value={value}
      onSuccess={onSuccess}
    />
  );
}
