import type { DBExecutor } from '../context'
import type { AgentDomainEvent, AgentDomainEventPayload } from '../domain/events'
import type { AgentDomainEventStore } from '../domain/repositories'
import { agentDomainEvents, type NewAgentDomainEventRow } from '../schema'

function toPayload(event: AgentDomainEvent): AgentDomainEventPayload {
  return {
    ...event,
    occurredAt: event.occurredAt.toISOString(),
  }
}

export class DrizzleAgentDomainEventStore implements AgentDomainEventStore {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async append(events: AgentDomainEvent[]): Promise<void> {
    if (events.length === 0) {
      return
    }

    const values: NewAgentDomainEventRow[] = events.map((event) => ({
      aggregateType: 'agent',
      aggregateId: event.agentCode,
      eventType: event.type,
      payload: toPayload(event),
      occurredAt: event.occurredAt,
    }))

    await this.db.insert(agentDomainEvents).values(values)
  }
}
