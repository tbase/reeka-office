import { createCategoryAction } from "../actions"
import { CategoryForm } from "../category-form"

export default function CmsCategoryCreatePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增分类</h1>
        <p className="text-muted-foreground text-sm">创建分类并设置需要录入的信息项。</p>
      </div>

      <CategoryForm action={createCategoryAction} submitLabel="创建分类" listHref="/cms/categories" />
    </div>
  )
}
