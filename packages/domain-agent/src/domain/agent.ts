import { AggregateRoot } from '@reeka-office/domain-shared'
import type { AgentDomainEvent, AgentProfileChange } from './events'
import {
  buildProfileChanges,
  normalizeAgentProfile,
  type AgentProfileInput,
  type AgentProfileState,
} from './profile'

export interface AgentSnapshot extends AgentProfileState {
  id: number | null
  deletedAt: string | Date | null
}

export class Agent extends AggregateRoot<AgentSnapshot, AgentDomainEvent> {
  private constructor(props: AgentSnapshot) {
    super(props)
  }

  static create(input: AgentProfileInput, occurredAt = new Date()): Agent {
    const profile = normalizeAgentProfile(input)
    const agent = new Agent({
      id: null,
      ...profile,
      deletedAt: null,
    })

    agent.record({
      type: 'AgentCreated',
      agentCode: agent.props.agentCode,
      changes: buildProfileChanges(null, profile),
      occurredAt,
    })

    return agent
  }

  static restore(snapshot: AgentSnapshot): Agent {
    return new Agent({
      ...snapshot,
      finacingScheme: snapshot.finacingScheme ? [...snapshot.finacingScheme] : null,
    })
  }

  get agentCode() {
    return this.props.agentCode
  }

  get leaderCode() {
    return this.props.leaderCode
  }

  get deletedAt() {
    return this.props.deletedAt
  }

  get profile(): AgentProfileState {
    return this.toProfileState()
  }

  restoreDeleted(occurredAt = new Date()): boolean {
    if (this.props.deletedAt === null) {
      return false
    }

    this.props.deletedAt = null
    this.record({
      type: 'AgentRestored',
      agentCode: this.props.agentCode,
      occurredAt,
    })
    return true
  }

  updateProfile(input: AgentProfileInput, occurredAt = new Date()): AgentProfileChange[] {
    const next = normalizeAgentProfile(input)
    if (next.agentCode !== this.props.agentCode) {
      throw new Error(`代理人编码不能变更: ${this.props.agentCode}`)
    }

    const changes = buildProfileChanges(this.toProfileState(), next)
    if (changes.length === 0) {
      return []
    }

    Object.assign(this.props, next)
    this.record({
      type: 'AgentProfileUpdated',
      agentCode: this.props.agentCode,
      changes,
      occurredAt,
    })
    this.recordSemanticProfileEvents(changes, occurredAt)
    return changes
  }

  updateLeader(leaderCode: string | null, occurredAt = new Date()): AgentProfileChange[] {
    return this.updateProfile({
      ...this.toProfileState(),
      leaderCode,
    }, occurredAt)
  }

  updateLastPromotionDate(lastPromotionDate: string | null, occurredAt = new Date()): AgentProfileChange[] {
    return this.updateProfile({
      ...this.toProfileState(),
      lastPromotionDate,
    }, occurredAt)
  }

  delete(occurredAt = new Date()): boolean {
    if (this.props.deletedAt !== null) {
      return false
    }

    this.props.deletedAt = occurredAt
    this.record({
      type: 'AgentDeleted',
      agentCode: this.props.agentCode,
      occurredAt,
    })
    return true
  }

  toSnapshot(): AgentSnapshot {
    return {
      ...this.props,
      finacingScheme: this.props.finacingScheme ? [...this.props.finacingScheme] : null,
    }
  }

  private toProfileState(): AgentProfileState {
    return {
      agentCode: this.props.agentCode,
      name: this.props.name,
      joinDate: this.props.joinDate,
      designation: this.props.designation,
      finacingScheme: this.props.finacingScheme ? [...this.props.finacingScheme] : null,
      leaderCode: this.props.leaderCode,
      lastPromotionDate: this.props.lastPromotionDate,
      agency: this.props.agency,
      division: this.props.division,
      branch: this.props.branch,
      unit: this.props.unit,
    }
  }

  private recordSemanticProfileEvents(changes: AgentProfileChange[], occurredAt: Date) {
    for (const change of changes) {
      if (change.field === 'leaderCode') {
        this.record({
          type: 'AgentLeaderChanged',
          agentCode: this.props.agentCode,
          before: typeof change.before === 'string' ? change.before : null,
          after: typeof change.after === 'string' ? change.after : null,
          occurredAt,
        })
      }

      if (change.field === 'lastPromotionDate') {
        this.record({
          type: 'AgentPromotionDateChanged',
          agentCode: this.props.agentCode,
          before: typeof change.before === 'string' ? change.before : null,
          after: typeof change.after === 'string' ? change.after : null,
          occurredAt,
        })
      }
    }
  }
}
