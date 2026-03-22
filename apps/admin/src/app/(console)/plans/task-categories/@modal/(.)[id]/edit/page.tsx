export const dynamic = "force-dynamic"

import { ListPlanTaskCategoriesQuery } from "@reeka-office/domain-plan"
import { PlanTaskCategoryEditFormDialog } from "./form-dialog"

import { updatePlanTaskCategoryAction } from "@/actions/plans/task-category-actions"
import { getRequiredAdminContext } from "@/lib/admin-context"

function parseId(value: string) {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效任务分类 ID")
  }

  return id
}

export default async function PlanTaskCategoryEditModalPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: rawId } = await params
  const categoryId = parseId(rawId)

  await getRequiredAdminContext()
  const categories = await new ListPlanTaskCategoriesQuery({ includeInactive: true }).query()
  const category = categories.find((item) => item.id === categoryId) ?? null

  if (!category) {
    return null
  }

  return (
    <PlanTaskCategoryEditFormDialog
      action={updatePlanTaskCategoryAction}
      category={{
        id: category.id,
        name: category.name,
      }}
    />
  )
}
