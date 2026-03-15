import type { PlanEnrollment } from './enrollment/plan-enrollment'
import type { Plan } from './plan/plan'
import type { PlanTask } from './plan/plan-task'
import type { PlanTaskCategory } from './task-category/plan-task-category'

export interface PlanRepository {
  findById(planId: number): Promise<Plan | null>
  save(plan: Plan): Promise<void>
  existsByName(name: string): Promise<boolean>
}

export interface PlanTaskCategoryRepository {
  findById(categoryId: number): Promise<PlanTaskCategory | null>
  findByName(name: string): Promise<PlanTaskCategory | null>
  listActive(): Promise<PlanTaskCategory[]>
  save(category: PlanTaskCategory): Promise<void>
  remove(categoryId: number): Promise<void>
  isInUse(categoryId: number): Promise<boolean>
}

export interface PlanEnrollmentRepository {
  findById(enrollmentId: number): Promise<PlanEnrollment | null>
  findByPlanAndAgent(planId: number, agentCode: string): Promise<PlanEnrollment | null>
  listRecalculableByPlan(planId: number): Promise<PlanEnrollment[]>
  save(enrollment: PlanEnrollment): Promise<void>
}

export interface PlanTaskLookup {
  findTaskById(taskId: number): Promise<PlanTask | null>
}
