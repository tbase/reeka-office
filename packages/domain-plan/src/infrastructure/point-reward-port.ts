import { CreatePointRecordCommand } from '@reeka-office/domain-point'

import type { PlanRewardPort } from '../domain/ports'

const PLAN_REWARD_SOURCE_TYPE = 'plan_task_completion'
const SYSTEM_CREATED_BY = 0

export class DomainPointPlanRewardPort implements PlanRewardPort {
  async grantTaskReward(input: {
    completionId: number
    agentId: number
    pointItemId: number
    remark?: string | null
  }): Promise<void> {
    await new CreatePointRecordCommand({
      agentId: input.agentId,
      pointItemId: input.pointItemId,
      remark: input.remark ?? null,
      createdBy: SYSTEM_CREATED_BY,
      sourceType: PLAN_REWARD_SOURCE_TYPE,
      sourceRef: String(input.completionId),
    }).execute()
  }
}
