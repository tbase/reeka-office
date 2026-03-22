import { PlanCreateFormDialog } from "./form-dialog"
import { createPlanAction } from "@/actions/plans/plan-actions"

export default function PlanCreateModalPage() {
  return <PlanCreateFormDialog action={createPlanAction} />
}
