import { PlanTaskCategoryCreateFormDialog } from "./form-dialog"
import { createPlanTaskCategoryAction } from "@/actions/plans/task-category-actions"

export default function PlanTaskCategoryCreateModalPage() {
  return <PlanTaskCategoryCreateFormDialog action={createPlanTaskCategoryAction} />
}
