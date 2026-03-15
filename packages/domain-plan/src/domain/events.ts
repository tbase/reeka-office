import type { PlanTaskCompletionMode } from './types'

export interface PlanPublished {
  type: 'PlanPublished'
  planId: number
  occurredAt: Date
}

export interface PlanArchived {
  type: 'PlanArchived'
  planId: number
  occurredAt: Date
}

export interface PlanStructureChanged {
  type: 'PlanStructureChanged'
  planId: number
  occurredAt: Date
}

export interface PlanAssigned {
  type: 'PlanAssigned'
  enrollmentId: number
  planId: number
  agentId: number
  occurredAt: Date
}

export interface PlanTaskCompleted {
  type: 'PlanTaskCompleted'
  enrollmentId: number
  completionId: number
  planId: number
  taskId: number
  agentId: number
  completionMode: PlanTaskCompletionMode
  pointItemId: number | null
  occurredAt: Date
}

export interface PlanEnrollmentBecameEligible {
  type: 'PlanEnrollmentBecameEligible'
  enrollmentId: number
  planId: number
  agentId: number
  occurredAt: Date
}

export interface PlanEnrollmentGraduated {
  type: 'PlanEnrollmentGraduated'
  enrollmentId: number
  planId: number
  agentId: number
  occurredAt: Date
}

export interface PlanEnrollmentCancelled {
  type: 'PlanEnrollmentCancelled'
  enrollmentId: number
  planId: number
  agentId: number
  occurredAt: Date
}

export type DomainEvent =
  | PlanPublished
  | PlanArchived
  | PlanStructureChanged
  | PlanAssigned
  | PlanTaskCompleted
  | PlanEnrollmentBecameEligible
  | PlanEnrollmentGraduated
  | PlanEnrollmentCancelled

export type DomainEventPayload = Record<string, unknown>
