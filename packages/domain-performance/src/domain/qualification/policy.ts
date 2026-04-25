import type { AgentProfile } from '../ports'
import { addMonths, type Period } from '../period'
import { QualificationAgent } from './agent'
import { ManagementQualificationPolicy } from './managementPolicy'
import { NewAgentQualificationPolicy } from './newAgentPolicy'
import type { QualificationAssessment } from './assessment'
import { SeniorAgentQualificationPolicy } from './seniorAgentPolicy'

export interface QualificationFactsProvider {
  sumPersonalNsc(startPeriod: Period, endPeriod: Period): Promise<number>
  sumDirectTeamNsc(startPeriod: Period, endPeriod: Period): Promise<number>
  wasQualifiedIn(period: Period): Promise<boolean>
}

export class QualificationPolicy {
  private readonly newAgentQualificationPolicy = new NewAgentQualificationPolicy()
  private readonly seniorAgentQualificationPolicy = new SeniorAgentQualificationPolicy()
  private readonly managementQualificationPolicy = new ManagementQualificationPolicy()

  async evaluate(input: {
    agent: AgentProfile
    period: Period
    facts: QualificationFactsProvider
  }): Promise<QualificationAssessment | null> {
    const agent = QualificationAgent.fromProfile(input.agent)
    if (!agent || !agent.canBeEvaluatedIn(input.period)) {
      return null
    }

    if (agent.isInNewAgentPeriod(input.period)) {
      return this.newAgentQualificationPolicy.evaluate({
        startPeriod: agent.joinPeriod,
        period: input.period,
        actualSales: await input.facts.sumPersonalNsc(agent.joinPeriod, input.period),
      })
    }

    const managementDesignation = agent.managementDesignation
    if (managementDesignation != null) {
      const managementAssessment = this.managementQualificationPolicy.evaluate({
        designation: managementDesignation,
        directTeamNsc: await input.facts.sumDirectTeamNsc(addMonths(input.period, -12), input.period),
      })
      if (managementAssessment) {
        return managementAssessment
      }
    }

    const previousPeriod = addMonths(input.period, -1)
    return await this.seniorAgentQualificationPolicy.evaluate({
      period: input.period,
      wasQualifiedPreviousMonth: () => input.facts.wasQualifiedIn(previousPeriod),
      actualSalesYearToDate: () => input.facts.sumPersonalNsc({
        year: input.period.year,
        month: 1,
      }, input.period),
    })
  }
}
