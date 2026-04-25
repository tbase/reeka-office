import { PromotionPolicy, type PromotionAssessment } from '../domain/promotionPolicy'
import {
  promotionMetricDefinitions,
  type AgentPromotionSnapshot,
  type PromotionMetric,
} from '../domain/promotionMetric'
import type { AgentDirectoryPort, TeamHierarchyPort } from '../domain/ports'
import type { PerformanceReadRepository } from '../domain/repositories'

export interface GetAgentPromotionSnapshotInput {
  agentCode: string
}

export class GetAgentPromotionSnapshotQuery {
  private readonly input: GetAgentPromotionSnapshotInput
  private readonly performanceReadRepository: PerformanceReadRepository
  private readonly agentDirectoryPort: AgentDirectoryPort
  private readonly teamHierarchyPort: TeamHierarchyPort
  private readonly promotionPolicy: PromotionPolicy

  constructor(
    input: GetAgentPromotionSnapshotInput,
    dependencies: {
      performanceReadRepository: PerformanceReadRepository
      agentDirectoryPort: AgentDirectoryPort
      teamHierarchyPort: TeamHierarchyPort
    },
    promotionPolicy = new PromotionPolicy(),
  ) {
    this.input = input
    this.performanceReadRepository = dependencies.performanceReadRepository
    this.agentDirectoryPort = dependencies.agentDirectoryPort
    this.teamHierarchyPort = dependencies.teamHierarchyPort
    this.promotionPolicy = promotionPolicy
  }

  async query(): Promise<AgentPromotionSnapshot> {
    const agent = await this.agentDirectoryPort.getPromotionProfile(this.input.agentCode)

    if (!agent) {
      throw new Error(`代理人不存在: ${this.input.agentCode}`)
    }

    const latestPeriod = (await this.performanceReadRepository.listPeriods({ limit: 1 }))[0] ?? null
    if (!latestPeriod) {
      return buildAgentPromotionSnapshot(this.promotionPolicy.assess({
        agent,
        latestPeriod: null,
        saleCalculateStartPeriod: null,
        personalSales: 0,
        personalNetCase: 0,
        teamSales: 0,
        directTeamSales: 0,
        qualifiedTeamCount: 0,
        qualifiedDirectCount: 0,
        selfQualifiedCount: 0,
        renewalRateTeamDirect: 0,
      }))
    }

    const saleCalculateStartPeriod = this.promotionPolicy.resolveSaleCalculateStartPeriod(
      latestPeriod,
      agent.lastPromotionDate,
      agent.joinDate,
    )
    const [allTeamCodes, directTeamCodes, latestMetrics] = await Promise.all([
      this.teamHierarchyPort.listMemberCodes(agent.agentCode, 'all'),
      this.teamHierarchyPort.listMemberCodes(agent.agentCode, 'direct'),
      this.performanceReadRepository.getPerformanceMetrics(agent.agentCode, latestPeriod),
    ])
    const [
      personalSales,
      personalNetCase,
      teamSales,
      directTeamSales,
      qualifiedTeamCount,
      qualifiedDirectCount,
      renewalRateTeamDirect,
    ] = await Promise.all([
      this.performanceReadRepository.sumSales([agent.agentCode], saleCalculateStartPeriod, latestPeriod),
      this.performanceReadRepository.sumNetCase([agent.agentCode], saleCalculateStartPeriod, latestPeriod),
      this.performanceReadRepository.sumSales(allTeamCodes, saleCalculateStartPeriod, latestPeriod),
      this.performanceReadRepository.sumSales(directTeamCodes, saleCalculateStartPeriod, latestPeriod),
      this.performanceReadRepository.countQualified(allTeamCodes, latestPeriod),
      this.performanceReadRepository.countQualified(directTeamCodes, latestPeriod),
      this.performanceReadRepository.getRenewalRate(agent.agentCode, latestPeriod),
    ])

    return buildAgentPromotionSnapshot(this.promotionPolicy.assess({
      agent,
      latestPeriod,
      saleCalculateStartPeriod,
      personalSales,
      personalNetCase,
      teamSales,
      directTeamSales,
      qualifiedTeamCount,
      qualifiedDirectCount,
      selfQualifiedCount: latestMetrics != null && latestMetrics.isQualified > 0 ? 1 : 0,
      renewalRateTeamDirect,
    }))
  }
}

function buildAgentPromotionSnapshot(assessment: PromotionAssessment): AgentPromotionSnapshot {
  return {
    ...assessment,
    metrics: assessment.metrics.map((metric) => {
      const definition = promotionMetricDefinitions.find((item) => item.key === metric.key)

      return {
        ...metric,
        label: definition?.label ?? metric.key,
        format: definition?.format ?? 'count',
      } satisfies PromotionMetric
    }),
  }
}
