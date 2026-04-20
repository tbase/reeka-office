import type { AgentProfile, TeamHierarchyPort } from '../ports'
import { type Period } from '../period'
import type { PerformanceReadRepository } from '../repositories'
import { ManagementQualificationPolicy } from './managementPolicy'
import { NewAgentQualificationPolicy } from './newAgentPolicy'
import type { QualificationAssessment } from './assessment'
import { SeniorAgentQualificationPolicy } from './seniorAgentPolicy'
import { getMonthsSinceJoin, parseJoinDate } from './support'

export class QualificationPolicy {
  private readonly newAgentQualificationPolicy: NewAgentQualificationPolicy
  private readonly seniorAgentQualificationPolicy: SeniorAgentQualificationPolicy
  private readonly managementQualificationPolicy: ManagementQualificationPolicy

  constructor(
    performanceReadRepository: PerformanceReadRepository,
    teamHierarchyPort: TeamHierarchyPort,
  ) {
    this.newAgentQualificationPolicy = new NewAgentQualificationPolicy(performanceReadRepository)
    this.seniorAgentQualificationPolicy = new SeniorAgentQualificationPolicy(performanceReadRepository)
    this.managementQualificationPolicy = new ManagementQualificationPolicy(
      performanceReadRepository,
      teamHierarchyPort,
    )
  }

  async evaluate(agent: AgentProfile, period: Period): Promise<QualificationAssessment | null> {
    const joinDate = parseJoinDate(agent.joinDate)
    if (!joinDate) {
      return null
    }

    const monthsSinceJoin = getMonthsSinceJoin(joinDate, period)
    if (monthsSinceJoin <= 0) {
      return null
    }

    if (monthsSinceJoin < 12) {
      return this.newAgentQualificationPolicy.evaluate(agent, joinDate, period)
    }

    const managementAssessment = await this.managementQualificationPolicy.evaluate(agent, period)
    if (managementAssessment) {
      return managementAssessment
    }

    return this.seniorAgentQualificationPolicy.evaluate(agent, period)
  }
}
