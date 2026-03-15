import type { DomainEvent } from './events'

export interface PlanRewardPort {
  grantTaskReward(input: {
    completionId: number
    agentCode: string
    pointItemId: number
    remark?: string | null
  }): Promise<void>
}

export interface DomainEventStore {
  append(events: DomainEvent[]): Promise<void>
}
