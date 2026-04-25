import { monthSince, parseDate, type DateParts } from '@reeka-office/domain-shared'

import type { AgentProfile } from '../ports'
import type { Period } from '../period'
import { rmDesignation } from './config'

export class QualificationAgent {
  private readonly profile: AgentProfile
  private readonly joinDate: DateParts

  private constructor(
    profile: AgentProfile,
    joinDate: DateParts,
  ) {
    this.profile = profile
    this.joinDate = joinDate
  }

  static fromProfile(profile: AgentProfile): QualificationAgent | null {
    const joinDate = parseDate(profile.joinDate)
    return joinDate ? new QualificationAgent(profile, joinDate) : null
  }

  get joinPeriod(): Period {
    return {
      year: this.joinDate.year,
      month: this.joinDate.month,
    }
  }

  canBeEvaluatedIn(period: Period): boolean {
    return monthSince(this.joinDate, period) > 0
  }

  isInNewAgentPeriod(period: Period): boolean {
    return monthSince(this.joinDate, period) < 12
  }

  get managementDesignation(): number | null {
    return this.profile.designation != null && this.profile.designation >= rmDesignation
      ? this.profile.designation
      : null
  }
}
