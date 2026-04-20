export interface MonthlyPerformanceCreated {
  type: 'MonthlyPerformanceCreated'
  agentCode: string
  year: number
  month: number
  occurredAt: Date
}

export interface MonthlyPerformanceUpdated {
  type: 'MonthlyPerformanceUpdated'
  agentCode: string
  year: number
  month: number
  occurredAt: Date
}

export interface QualificationRecalculated {
  type: 'QualificationRecalculated'
  agentCode: string
  year: number
  month: number
  occurredAt: Date
}

export type DomainEvent =
  | MonthlyPerformanceCreated
  | MonthlyPerformanceUpdated
  | QualificationRecalculated

export type DomainEventPayload = Record<string, unknown>
