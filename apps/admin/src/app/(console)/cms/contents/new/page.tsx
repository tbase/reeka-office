import { ListCategoriesQuery } from "@reeka-office/domain-cms"

import { createContentAction } from "../actions"
import { ContentForm } from "../content-form"

function parseOptionalId(value: string | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    return undefined
  }

  return id
}

export default async function CmsContentCreatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const categories = await new ListCategoriesQuery().query()
  const defaultCategoryId = parseOptionalId(
    typeof params.categoryId === "string" ? params.categoryId : undefined
  )
  const resolvedDefaultCategoryId = categories.some((category) => category.id === defaultCategoryId)
    ? defaultCategoryId
    : undefined

  const categoriesForFields = categories.map((category) => ({
    id: category.id,
    name: category.name,
    fieldSchema: category.fieldSchema,
  }))

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增内容</h1>
        <p className="text-muted-foreground text-sm">请选择分类并填写标题、正文与扩展信息。</p>
      </div>

      <ContentForm
        action={createContentAction}
        categories={categoriesForFields}
        submitLabel="创建内容"
        cancelHref="/cms/contents"
        value={resolvedDefaultCategoryId ? { categoryId: resolvedDefaultCategoryId } : undefined}
      />
    </div>
  )
}
