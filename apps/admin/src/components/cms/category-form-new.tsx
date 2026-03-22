"use client";

import { useRouter } from "next/navigation";

import type { CreateCategoryAction } from "@/actions/cms/category-actions";
import { createCategoryActionSchema } from "@/actions/cms/form-schemas";

import { CategoryForm } from "./category-form";

export function CategoryFormNew({
  id,
  action,
}: {
  id: string;
  action: CreateCategoryAction;
}) {
  const router = useRouter();

  function handleSuccess() {
    router.push("/cms/categories");
  }

  return (
    <CategoryForm
      action={action}
      schema={createCategoryActionSchema}
      id={id}
      onSuccess={handleSuccess}
    />
  );
}
