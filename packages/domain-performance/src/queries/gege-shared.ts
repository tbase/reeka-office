import { agentHierarchy, agents, getDesignationName } from '@reeka-office/domain-agent'
import { and, asc, desc, eq, gt, inArray } from 'drizzle-orm'

import type { DB } from '../context'
import { apm } from '../schema'
import { GetLatestApmPeriodQuery, type ApmPeriod } from './get-latest-apm-period'

export type GegeTeamScope = 'direct' | 'all'
export type GegeRelationLabel = '直属' | '非直属'

export interface GegeAgentInfo {
  agentCode: string
  name: string
  designation: number | null
  designationName: string | null
  leaderCode: string | null
}

export interface GegeCurrentMetrics {
  nsc: number
  nscSum: number
  netCase: number
  netCaseSum: number
  isQualified: boolean
  netAfyp: number
  netAfypSum: number
  netAfycSum: number
  nscHp: number
  nscHpSum: number
  netAfypHp: number
  netAfypHpSum: number
  netAfypH: number
  netAfypHSum: number
  netCaseH: number
  netCaseHSum: number
  renewalRateTeam: number
}

export interface GegeHistoryItem extends GegeCurrentMetrics {
  year: number
  month: number
}

export interface GegeTeamSummary {
  memberCount: number
  nsc: number
  nscSum: number
  netCase: number
  netCaseSum: number
  qualifiedCount: number
}

export interface GegeTeamMemberItem extends GegeAgentInfo {
  hierarchy: number
  relationLabel: GegeRelationLabel
  nsc: number
  netCase: number
  isQualified: boolean
  nscSum: number
  netCaseSum: number
}

type GegeMetricRow = {
  agentCode: string
  nsc: number
  nscSum: number
  netCase: number
  netCaseSum: number
  isQualified: number
  netAfyp: number
  netAfypSum: number
  netAfycSum: number
  nscHp: number
  nscHpSum: number
  netAfypHp: number
  netAfypHpSum: number
  netAfypH: number
  netAfypHSum: number
  netCaseH: number
  netCaseHSum: number
  renewalRateTeam: number
}

type TeamMemberBase = {
  agentCode: string
  name: string
  designation: number | null
  leaderCode: string | null
  hierarchy: number
}

export function createEmptyMetrics(): GegeCurrentMetrics {
  return {
    nsc: 0,
    nscSum: 0,
    netCase: 0,
    netCaseSum: 0,
    isQualified: false,
    netAfyp: 0,
    netAfypSum: 0,
    netAfycSum: 0,
    nscHp: 0,
    nscHpSum: 0,
    netAfypHp: 0,
    netAfypHpSum: 0,
    netAfypH: 0,
    netAfypHSum: 0,
    netCaseH: 0,
    netCaseHSum: 0,
    renewalRateTeam: 0,
  }
}

function mapMetrics(row?: Omit<GegeMetricRow, 'agentCode'> | null): GegeCurrentMetrics {
  if (!row) {
    return createEmptyMetrics()
  }

  return {
    nsc: row.nsc,
    nscSum: row.nscSum,
    netCase: row.netCase,
    netCaseSum: row.netCaseSum,
    isQualified: row.isQualified > 0,
    netAfyp: row.netAfyp,
    netAfypSum: row.netAfypSum,
    netAfycSum: row.netAfycSum,
    nscHp: row.nscHp,
    nscHpSum: row.nscHpSum,
    netAfypHp: row.netAfypHp,
    netAfypHpSum: row.netAfypHpSum,
    netAfypH: row.netAfypH,
    netAfypHSum: row.netAfypHSum,
    netCaseH: row.netCaseH,
    netCaseHSum: row.netCaseHSum,
    renewalRateTeam: row.renewalRateTeam,
  }
}

function toRelationLabel(hierarchy: number): GegeRelationLabel {
  return hierarchy === 1 ? '直属' : '非直属'
}

function compareTeamMembers(left: GegeTeamMemberItem, right: GegeTeamMemberItem): number {
  if (Number(left.isQualified) !== Number(right.isQualified)) {
    return Number(left.isQualified) - Number(right.isQualified)
  }

  if (left.nsc !== right.nsc) {
    return right.nsc - left.nsc
  }

  if (left.netCase !== right.netCase) {
    return right.netCase - left.netCase
  }

  return left.agentCode.localeCompare(right.agentCode)
}

export async function getLatestGegePeriod(): Promise<ApmPeriod | null> {
  return new GetLatestApmPeriodQuery().query()
}

export async function getGegeAgentInfo(
  db: DB,
  agentCode: string,
): Promise<GegeAgentInfo | null> {
  const rows = await db
    .select({
      agentCode: agents.agentCode,
      name: agents.name,
      designation: agents.designation,
      leaderCode: agents.leaderCode,
    })
    .from(agents)
    .where(eq(agents.agentCode, agentCode))
    .limit(1)

  const row = rows[0]
  if (!row?.agentCode) {
    return null
  }

  return {
    agentCode: row.agentCode,
    name: row.name,
    designation: row.designation,
    designationName: getDesignationName(row.designation),
    leaderCode: row.leaderCode,
  }
}

export async function listGegeAvailableYears(
  db: DB,
  agentCode: string,
): Promise<number[]> {
  const rows = await db
    .select({
      year: apm.year,
    })
    .from(apm)
    .where(eq(apm.agentCode, agentCode))
    .groupBy(apm.year)
    .orderBy(desc(apm.year))

  return rows.map((row) => row.year)
}

export function resolveGegeYear(
  availableYears: number[],
  requestedYear?: number,
  fallbackPeriod?: ApmPeriod | null,
): number {
  if (
    typeof requestedYear === 'number'
    && Number.isInteger(requestedYear)
    && availableYears.includes(requestedYear)
  ) {
    return requestedYear
  }

  return availableYears[0] ?? fallbackPeriod?.year ?? new Date().getFullYear()
}

export async function getGegeMetricsMap(
  db: DB,
  agentCodes: string[],
  period: ApmPeriod | null,
): Promise<Map<string, GegeCurrentMetrics>> {
  if (!period || agentCodes.length === 0) {
    return new Map()
  }

  const rows = await db
    .select({
      agentCode: apm.agentCode,
      nsc: apm.nsc,
      nscSum: apm.nscSum,
      netCase: apm.netCase,
      netCaseSum: apm.netCaseSum,
      isQualified: apm.isQualified,
      netAfyp: apm.netAfyp,
      netAfypSum: apm.netAfypSum,
      netAfycSum: apm.netAfycSum,
      nscHp: apm.nscHp,
      nscHpSum: apm.nscHpSum,
      netAfypHp: apm.netAfypHp,
      netAfypHpSum: apm.netAfypHpSum,
      netAfypH: apm.netAfypH,
      netAfypHSum: apm.netAfypHSum,
      netCaseH: apm.netCaseH,
      netCaseHSum: apm.netCaseHSum,
      renewalRateTeam: apm.renewalRateTeam,
    })
    .from(apm)
    .where(and(
      inArray(apm.agentCode, agentCodes),
      eq(apm.year, period.year),
      eq(apm.month, period.month),
    ))

  return new Map(
    rows.map((row) => [
      row.agentCode,
      mapMetrics(row),
    ]),
  )
}

export async function listGegeHistory(
  db: DB,
  agentCode: string,
  year: number,
): Promise<GegeHistoryItem[]> {
  const rows = await db
    .select({
      month: apm.month,
      nsc: apm.nsc,
      nscSum: apm.nscSum,
      netCase: apm.netCase,
      netCaseSum: apm.netCaseSum,
      isQualified: apm.isQualified,
      netAfyp: apm.netAfyp,
      netAfypSum: apm.netAfypSum,
      netAfycSum: apm.netAfycSum,
      nscHp: apm.nscHp,
      nscHpSum: apm.nscHpSum,
      netAfypHp: apm.netAfypHp,
      netAfypHpSum: apm.netAfypHpSum,
      netAfypH: apm.netAfypH,
      netAfypHSum: apm.netAfypHSum,
      netCaseH: apm.netCaseH,
      netCaseHSum: apm.netCaseHSum,
      renewalRateTeam: apm.renewalRateTeam,
    })
    .from(apm)
    .where(and(
      eq(apm.agentCode, agentCode),
      eq(apm.year, year),
    ))
    .orderBy(asc(apm.month))

  const historyByMonth = new Map(
    rows.map((row) => [
      row.month,
      mapMetrics(row),
    ]),
  )

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1

    return {
      year,
      month,
      ...(historyByMonth.get(month) ?? createEmptyMetrics()),
    }
  })
}

export async function listGegeTeamMemberBase(
  db: DB,
  leaderCode: string,
  scope: GegeTeamScope,
): Promise<TeamMemberBase[]> {
  const rows = await db
    .select({
      agentCode: agentHierarchy.agentCode,
      name: agents.name,
      designation: agents.designation,
      leaderCode: agents.leaderCode,
      hierarchy: agentHierarchy.hierarchy,
    })
    .from(agentHierarchy)
    .innerJoin(agents, eq(agentHierarchy.agentCode, agents.agentCode))
    .where(and(
      eq(agentHierarchy.leaderCode, leaderCode),
      scope === 'direct'
        ? eq(agentHierarchy.hierarchy, 1)
        : gt(agentHierarchy.hierarchy, 0),
    ))
    .orderBy(
      asc(agentHierarchy.hierarchy),
      asc(agents.name),
      asc(agentHierarchy.agentCode),
    )

  return rows.filter((row): row is TeamMemberBase => !!row.agentCode)
}

export function buildGegeTeamMembers(
  members: TeamMemberBase[],
  metricsMap: Map<string, GegeCurrentMetrics>,
): GegeTeamMemberItem[] {
  return members
    .map((member) => {
      const metrics = metricsMap.get(member.agentCode) ?? createEmptyMetrics()

      return {
        agentCode: member.agentCode,
        name: member.name,
        designation: member.designation,
        designationName: getDesignationName(member.designation),
        leaderCode: member.leaderCode,
        hierarchy: member.hierarchy,
        relationLabel: toRelationLabel(member.hierarchy),
        nsc: metrics.nsc,
        netCase: metrics.netCase,
        isQualified: metrics.isQualified,
        nscSum: metrics.nscSum,
        netCaseSum: metrics.netCaseSum,
      }
    })
    .sort(compareTeamMembers)
}

export function summarizeGegeTeamMembers(
  members: GegeTeamMemberItem[],
): GegeTeamSummary {
  return members.reduce<GegeTeamSummary>((summary, member) => ({
    memberCount: summary.memberCount + 1,
    nsc: summary.nsc + member.nsc,
    nscSum: summary.nscSum + member.nscSum,
    netCase: summary.netCase + member.netCase,
    netCaseSum: summary.netCaseSum + member.netCaseSum,
    qualifiedCount: summary.qualifiedCount + (member.isQualified ? 1 : 0),
  }), {
    memberCount: 0,
    nsc: 0,
    nscSum: 0,
    netCase: 0,
    netCaseSum: 0,
    qualifiedCount: 0,
  })
}

export async function getGegeMemberRelation(
  db: DB,
  leaderCode: string,
  agentCode: string,
): Promise<{ hierarchy: number, relationLabel: GegeRelationLabel } | null> {
  const rows = await db
    .select({
      hierarchy: agentHierarchy.hierarchy,
    })
    .from(agentHierarchy)
    .where(and(
      eq(agentHierarchy.leaderCode, leaderCode),
      eq(agentHierarchy.agentCode, agentCode),
    ))
    .limit(1)

  const row = rows[0]
  if (!row) {
    return null
  }

  return {
    hierarchy: row.hierarchy,
    relationLabel: toRelationLabel(row.hierarchy),
  }
}
