import type { DomainEvent } from './events'

export interface PlanRewardPort {
  grantTaskReward(input: {
    completionId: number
    agentId: number
    pointItemId: number
    remark?: string | null
  }): Promise<void>
}

export interface DomainEventStore {
  append(events: DomainEvent[]): Promise<void>
}
