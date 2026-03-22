"use client";

import { useRouter } from "next/navigation";

import type { CreateContentAction } from "@/actions/cms/content-actions";
import { createContentActionSchema } from "@/actions/cms/form-schemas";
import type { CategoryOption } from "@/components/cms/content-fields";

import { ContentForm } from "./content-form";

export function ContentFormNew({
  id,
  categories,
  categoryId,
  action,
}: {
  id: string;
  categories: CategoryOption[];
  categoryId?: number;
  action: CreateContentAction;
}) {
  const router = useRouter();

  function handleSuccess() {
    router.push("/cms/contents");
  }

  return (
    <ContentForm
      action={action}
      schema={createContentActionSchema}
      categories={categories}
      id={id}
      value={categoryId ? { categoryId } : undefined}
      onSuccess={handleSuccess}
    />
  );
}
