"use client";

import { useRouter } from "next/navigation";

import { CategoryForm } from "./category-form";

export function CategoryFormNew({
  id,
  action,
}: {
  id: string;
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>;
}) {
  const router = useRouter();

  function handleSuccess() {
    router.push("/cms/categories");
  }

  return <CategoryForm action={action} id={id} onSuccess={handleSuccess} />;
}
