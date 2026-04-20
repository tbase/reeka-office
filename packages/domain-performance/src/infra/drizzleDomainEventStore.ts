import type { DBExecutor } from '../context'
import type { DomainEventStore } from '../domain/ports'
import type { DomainEvent, DomainEventPayload } from '../domain/events'
import { performanceDomainEvents, type NewPerformanceDomainEventRow } from '../schema'

function toPayload(event: DomainEvent): DomainEventPayload {
  return {
    ...event,
    occurredAt: event.occurredAt.toISOString(),
  }
}

export class DrizzleDomainEventStore implements DomainEventStore {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async append(events: DomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return
    }

    const values: NewPerformanceDomainEventRow[] = events.map((event) => ({
      aggregateType: 'apm',
      aggregateId: `${event.agentCode}:${event.year}-${String(event.month).padStart(2, '0')}`,
      eventType: event.type,
      payload: toPayload(event),
      occurredAt: event.occurredAt,
    }))

    await this.db.insert(performanceDomainEvents).values(values)
  }
}
