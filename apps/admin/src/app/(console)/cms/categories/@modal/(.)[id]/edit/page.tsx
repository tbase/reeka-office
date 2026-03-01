import { ListCategoriesQuery } from "@reeka-office/domain-cms";
import { notFound } from "next/navigation";

import { CategoryEditFormDialog } from "./form-dialog";

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效分类 ID");
  }
  return id;
}

export default async function CmsCategoryEditModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = parseId(idParam);

  const categories = await new ListCategoriesQuery().query();
  const category = categories.find((item) => item.id === id) ?? null;

  if (!category) {
    notFound();
  }

  return (
    <CategoryEditFormDialog
      category={{
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        fieldSchema: category.fieldSchema,
      }}
    />
  );
}
