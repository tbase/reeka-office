import {
  ListCategoriesQuery,
  ListContentsQuery,
} from "@reeka-office/domain-cms";
import { notFound } from "next/navigation";

import { ContentEditFormDialog } from "./form-dialog";

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效内容 ID");
  }
  return id;
}

export default async function CmsContentEditModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = parseId(idParam);

  const [categories, { contents }] = await Promise.all([
    new ListCategoriesQuery().query(),
    new ListContentsQuery().query(),
  ]);

  const content = contents.find((item) => item.id === id) ?? null;

  if (!content) {
    notFound();
  }

  return (
    <ContentEditFormDialog
      categories={categories}
      value={{
        id: content.id,
        name: content.name,
        content: content.content,
        categoryId: content.categoryId,
        fields: content.fields,
      }}
    />
  );
}
