import type { AgentProfile, TeamHierarchyPort } from '../ports'
import { addMonths, type Period } from '../period'
import type { PerformanceReadRepository } from '../repositories'
import type { QualificationAssessment } from './assessment'
import { rmDesignation, seniorTeamNscTargets } from './support'

export class ManagementQualificationPolicy {
  private readonly performanceReadRepository: PerformanceReadRepository
  private readonly teamHierarchyPort: TeamHierarchyPort

  constructor(
    performanceReadRepository: PerformanceReadRepository,
    teamHierarchyPort: TeamHierarchyPort,
  ) {
    this.performanceReadRepository = performanceReadRepository
    this.teamHierarchyPort = teamHierarchyPort
  }

  async evaluate(
    agent: AgentProfile,
    period: Period,
  ): Promise<QualificationAssessment | null> {
    if (agent.designation == null || agent.designation < rmDesignation) {
      return null
    }

    const targetBase = seniorTeamNscTargets[agent.designation - rmDesignation]
    if (targetBase == null) {
      return null
    }

    const directCodes = await this.teamHierarchyPort.listMemberCodes(agent.agentCode, 'direct')
    const directTeamNsc = await this.performanceReadRepository.sumNsc(
      directCodes,
      addMonths(period, -12),
      period,
    )

    if (directTeamNsc - targetBase * 100 < 0) {
      return null
    }

    return {
      isQualified: true,
      qualifiedGap: 0,
    }
  }
}
