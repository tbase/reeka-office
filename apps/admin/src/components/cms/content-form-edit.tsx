"use client";

import type { UpdateContentAction } from "@/actions/cms/content-actions";
import { updateContentActionSchema } from "@/actions/cms/form-schemas";
import type { CategoryOption } from "@/components/cms/content-fields";

import { ContentForm } from "./content-form";

type ContentValue = {
  id: number;
  name: string;
  content: string;
  categoryId: number;
  fields: Record<string, unknown>;
};

export function ContentFormEdit({
  id,
  categories,
  value,
  action,
}: {
  id: string;
  categories: CategoryOption[];
  value: ContentValue;
  action: UpdateContentAction;
}) {
  return (
    <ContentForm
      action={action}
      schema={updateContentActionSchema}
      categories={categories}
      id={id}
      value={value}
    />
  );
}
