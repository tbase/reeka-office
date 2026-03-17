import { planDomainEvents, type NewPlanDomainEventRow } from '../schema'
import type { DBExecutor } from '../context'
import type { DomainEventStore } from '../domain/ports'
import type { DomainEvent, DomainEventPayload } from '../domain/events'

function toPayload(event: DomainEvent): DomainEventPayload {
  return {
    ...event,
    occurredAt: event.occurredAt.toISOString(),
  }
}

function getAggregateType(event: DomainEvent): string {
  switch (event.type) {
    case 'PlanPublished':
    case 'PlanArchived':
    case 'PlanStructureChanged':
      return 'plan'
    default:
      return 'plan_enrollment'
  }
}

function getAggregateId(event: DomainEvent): number {
  switch (event.type) {
    case 'PlanPublished':
    case 'PlanArchived':
    case 'PlanStructureChanged':
      return event.planId
    default:
      return event.enrollmentId
  }
}

export class DrizzleDomainEventStore implements DomainEventStore {
  constructor(
    private readonly db: DBExecutor,
    private readonly tenantId: number,
  ) {}

  async append(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return
    }

    const values: NewPlanDomainEventRow[] = events.map((event) => ({
      tenantId: this.tenantId,
      aggregateType: getAggregateType(event),
      aggregateId: getAggregateId(event),
      eventType: event.type,
      payload: toPayload(event),
      occurredAt: event.occurredAt,
    }))

    await this.db.insert(planDomainEvents).values(values)
  }
}
