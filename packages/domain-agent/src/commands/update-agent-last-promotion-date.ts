import type { AppendAgentLogInput } from '../agent-log'
import type { AgentApplicationDependencies } from '../application/runtime'
import type { AgentDomainEvent } from '../domain/events'

export interface UpdateAgentLastPromotionDateInput {
  agentCode: string
  lastPromotionDate: string | null
}

export interface UpdateAgentLastPromotionDateResult {
  agentCode: string
  lastPromotionDate: string | null
}

export class UpdateAgentLastPromotionDateCommand {
  private readonly input: UpdateAgentLastPromotionDateInput
  private readonly dependencies: AgentApplicationDependencies

  constructor(
    input: UpdateAgentLastPromotionDateInput,
    dependencies: AgentApplicationDependencies,
  ) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<UpdateAgentLastPromotionDateResult> {
    const agentCode = this.input.agentCode.trim().toUpperCase()
    const lastPromotionDate = normalizeLastPromotionDate(this.input.lastPromotionDate)
    const now = this.dependencies.now()

    if (!agentCode) {
      throw new Error('代理人编码不能为空')
    }

    return this.dependencies.executeInTransaction(async (runtime) => {
      const agent = await runtime.agentRepository.findActiveByCode(agentCode)

      if (!agent) {
        throw new Error(`代理人不存在: ${agentCode}`)
      }

      const changes = agent.updateLastPromotionDate(lastPromotionDate, now)
      const events = agent.pullDomainEvents()

      if (changes.length > 0) {
        await runtime.agentRepository.save(agent)
        await runtime.domainEventStore.append(events)
        await runtime.agentLogStore.append(toPromotionDateLogs(events))
      }

      return {
        agentCode,
        lastPromotionDate,
      }
    })
  }
}

function normalizeLastPromotionDate(value: string | null | undefined): string | null {
  const normalizedValue = value?.trim()
  if (!normalizedValue) {
    return null
  }

  const monthMatched = normalizedValue.match(/^(\d{4})-(\d{2})$/)
  if (monthMatched) {
    return `${monthMatched[1]}-${monthMatched[2]}-01`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    return normalizedValue
  }

  throw new Error('上次晋级日期格式无效')
}

function toPromotionDateLogs(events: AgentDomainEvent[]): AppendAgentLogInput[] {
  return events
    .filter((event): event is Extract<AgentDomainEvent, { type: 'AgentPromotionDateChanged' }> =>
      event.type === 'AgentPromotionDateChanged',
    )
    .map((event) => ({
      agentCode: event.agentCode,
      category: 'profile',
      action: 'updated',
      source: 'UpdateAgentLastPromotionDateCommand',
      changes: [{
        field: 'lastPromotionDate',
        before: event.before,
        after: event.after,
      }],
    }))
}
