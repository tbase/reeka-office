import type { AgentProfile, TeamHierarchyPort } from '../domain/ports'
import type { Period } from '../domain/period'
import type { PerformanceReadRepository } from '../domain/repositories'
import type { QualificationAssessment } from '../domain/qualification/assessment'
import { QualificationPolicy, type QualificationFactsProvider } from '../domain/qualification/policy'

export class QualificationEvaluator {
  private readonly performanceReadRepository: PerformanceReadRepository
  private readonly teamHierarchyPort: TeamHierarchyPort
  private readonly policy: QualificationPolicy

  constructor(
    performanceReadRepository: PerformanceReadRepository,
    teamHierarchyPort: TeamHierarchyPort,
    policy = new QualificationPolicy(),
  ) {
    this.performanceReadRepository = performanceReadRepository
    this.teamHierarchyPort = teamHierarchyPort
    this.policy = policy
  }

  async evaluate(agent: AgentProfile, period: Period): Promise<QualificationAssessment | null> {
    return this.policy.evaluate({
      agent,
      period,
      facts: this.createFactsProvider(agent.agentCode),
    })
  }

  private createFactsProvider(agentCode: string): QualificationFactsProvider {
    return {
      sumPersonalNsc: (startPeriod, endPeriod) => this.performanceReadRepository.sumNsc(
        [agentCode],
        startPeriod,
        endPeriod,
      ),
      sumDirectTeamNsc: async (startPeriod, endPeriod) => {
        const directCodes = await this.teamHierarchyPort.listMemberCodes(agentCode, 'direct')
        return this.performanceReadRepository.sumNsc(directCodes, startPeriod, endPeriod)
      },
      wasQualifiedIn: async (period) => {
        const metrics = await this.performanceReadRepository.getPerformanceMetrics(agentCode, period)
        return metrics != null && metrics.isQualified > 0
      },
    }
  }
}
