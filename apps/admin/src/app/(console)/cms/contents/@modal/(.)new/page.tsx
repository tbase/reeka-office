import { ListCategoriesQuery } from "@reeka-office/domain-cms";

import { getRequiredAdminContext } from "@/lib/admin-context";

import { ContentFormDialog } from "./form-dialog";

function parseOptionalId(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) return undefined;
  return id;
}

export default async function CmsContentNewModal({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const ctx = await getRequiredAdminContext();
  const categories = await new ListCategoriesQuery(ctx).query();

  const defaultCategoryId = parseOptionalId(
    typeof params.categoryId === "string" ? params.categoryId : undefined,
  );
  const resolvedDefaultCategoryId = categories.some(
    (c) => c.id === defaultCategoryId,
  )
    ? defaultCategoryId
    : undefined;

  const categoriesForFields = categories.map((category) => ({
    id: category.id,
    name: category.name,
    fieldSchema: category.fieldSchema,
    hideContent: Boolean(category.hideContent),
  }));

  return (
    <ContentFormDialog
      categories={categoriesForFields}
      defaultCategoryId={resolvedDefaultCategoryId}
    />
  );
}
