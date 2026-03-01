"use client";

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
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>;
}) {
  return (
    <ContentForm
      action={action}
      categories={categories}
      id={id}
      value={value}
    />
  );
}
