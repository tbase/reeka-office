import { agents } from '@reeka-office/domain-agent'
import { and, asc, desc, eq } from 'drizzle-orm'

import { getDb, type DB } from '../context'
import { apm } from '../schema'

export interface ListApmInput {
  year: number
  month: number
}

export interface ApmListItem {
  id: number
  agentCode: string
  agentName: string
  year: number
  month: number
  nsc: number
  nscSum: number
  netAfycSum: number
  netAfyp: number
  netAfypSum: number
  netAfypAssigned: number
  netAfypAssignedSum: number
  netCase: number
  netCaseSum: number
  netCaseAssigned: number
  netCaseAssignedSum: number
  isQualified: number
  isQualifiedAssigned: number
  nscHp: number
  nscHpSum: number
  netAfypHp: number
  netAfypHpSum: number
  netAfypH: number
  netAfypHSum: number
  netCaseH: number
  netCaseHSum: number
  renewalRateTeam: number
  createdAt: Date
  updatedAt: Date
}

export class ListApmQuery {
  private readonly db: DB
  private readonly input: ListApmInput

  constructor(input: ListApmInput) {
    this.db = getDb()
    this.input = input
  }

  async query(): Promise<ApmListItem[]> {
    return this.db
      .select({
        id: apm.id,
        agentCode: apm.agentCode,
        agentName: agents.name,
        year: apm.year,
        month: apm.month,
        nsc: apm.nsc,
        nscSum: apm.nscSum,
        netAfycSum: apm.netAfycSum,
        netAfyp: apm.netAfyp,
        netAfypSum: apm.netAfypSum,
        netAfypAssigned: apm.netAfypAssigned,
        netAfypAssignedSum: apm.netAfypAssignedSum,
        netCase: apm.netCase,
        netCaseSum: apm.netCaseSum,
        netCaseAssigned: apm.netCaseAssigned,
        netCaseAssignedSum: apm.netCaseAssignedSum,
        isQualified: apm.isQualified,
        isQualifiedAssigned: apm.isQualifiedAssigned,
        nscHp: apm.nscHp,
        nscHpSum: apm.nscHpSum,
        netAfypHp: apm.netAfypHp,
        netAfypHpSum: apm.netAfypHpSum,
        netAfypH: apm.netAfypH,
        netAfypHSum: apm.netAfypHSum,
        netCaseH: apm.netCaseH,
        netCaseHSum: apm.netCaseHSum,
        renewalRateTeam: apm.renewalRateTeam,
        createdAt: apm.createdAt,
        updatedAt: apm.updatedAt,
      })
      .from(apm)
      .innerJoin(
        agents,
        eq(apm.agentCode, agents.agentCode),
      )
      .where(and(
        eq(apm.year, this.input.year),
        eq(apm.month, this.input.month),
      ))
      .orderBy(
        desc(apm.nsc),
        asc(apm.agentCode),
      )
  }
}
