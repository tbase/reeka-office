import { ListCategoriesQuery } from "@reeka-office/domain-cms"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LinkButton } from "@/components/ui/link-button"

import { CategoryFormEdit } from "@/components/cms/category-form-edit"

import { updateCategoryAction } from "../../actions"

function parseId(value: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效分类 ID")
  }
  return id
}

export default async function CmsCategoryEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idParam } = await params
  const id = parseId(idParam)

  const categories = await new ListCategoriesQuery().query()
  const category = categories.find((item) => item.id === id) ?? null

  if (!category) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>分类不存在</CardTitle>
          <CardDescription>该分类可能已被删除。</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/cms/categories">返回分类列表</Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">编辑分类：{category.name}</h1>
        <p className="text-muted-foreground text-sm">修改后将应用到该分类下后续内容录入。</p>
      </div>

      <CategoryFormEdit
        action={updateCategoryAction}
        id="category-form"
        value={{
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          fieldSchema: category.fieldSchema,
        }}
      />

      <div className="flex gap-2 max-w-xl">
        <Button type="submit" form="category-form">保存分类</Button>
        <LinkButton href="/cms/categories" variant="ghost">取消</LinkButton>
      </div>
    </div>
  )
}
