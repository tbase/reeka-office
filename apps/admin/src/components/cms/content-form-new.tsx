"use client";

import { useRouter } from "next/navigation";

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
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>;
}) {
  const router = useRouter();

  function handleSuccess() {
    router.push("/cms/contents");
  }

  return (
    <ContentForm
      action={action}
      categories={categories}
      id={id}
      value={categoryId ? { categoryId } : undefined}
      onSuccess={handleSuccess}
    />
  );
}
