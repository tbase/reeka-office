import type { DomainEvent } from './events'
import type { Period } from './period'

export interface AgentProfile {
  agentCode: string
  joinDate: string | null
  designation: number | null
  lastPromotionDate: string | null
}

export type TeamScope = 'all' | 'direct'

export interface AgentDirectoryPort {
  listProfiles(agentCodes: string[]): Promise<AgentProfile[]>
  getPromotionProfile(agentCode: string): Promise<AgentProfile | null>
}

export interface TeamHierarchyPort {
  listMemberCodes(leaderCode: string, scope: TeamScope): Promise<string[]>
}

export interface DomainEventStore {
  append(events: DomainEvent[]): Promise<void>
}

export interface PeriodRecord {
  agentCode: string
  period: Period
}
