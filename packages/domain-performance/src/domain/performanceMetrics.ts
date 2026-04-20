import { ensureInteger } from './shared/validation'

export interface ImportedApmMetrics {
  nsc: number
  nscSum: number
  netAfycSum: number
  netAfyp: number
  netAfypSum: number
  netAfypAssigned: number
  netAfypAssignedSum: number
  nscHp: number
  nscHpSum: number
  netAfypHp: number
  netAfypHpSum: number
  netAfypH: number
  netAfypHSum: number
  netCaseH: number
  netCaseHSum: number
  netCase: number
  netCaseSum: number
  netCaseAssigned: number
  netCaseAssignedSum: number
  isQualified: number
  isQualifiedAssigned: number
  renewalRateTeam: number
}

export interface StoredApmMetrics extends ImportedApmMetrics {
  qualifiedGap: number | null
  isQualifiedNextMonth: boolean | null
  qualifiedGapNextMonth: number | null
}

export interface PerformanceMetrics {
  nsc: number
  nscSum: number
  netCase: number
  netCaseSum: number
  isQualified: boolean
  qualifiedGap: number | null
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
  isQualifiedNextMonth: boolean | null
  qualifiedGapNextMonth: number | null
}

export type PerformanceMetricName = 'nsc' | 'netCase'
export type PerformanceMetricsSource = Pick<
  StoredApmMetrics,
  | 'nsc'
  | 'nscSum'
  | 'netCase'
  | 'netCaseSum'
  | 'isQualified'
  | 'qualifiedGap'
  | 'netAfyp'
  | 'netAfypSum'
  | 'netAfycSum'
  | 'nscHp'
  | 'nscHpSum'
  | 'netAfypHp'
  | 'netAfypHpSum'
  | 'netAfypH'
  | 'netAfypHSum'
  | 'netCaseH'
  | 'netCaseHSum'
  | 'renewalRateTeam'
  | 'isQualifiedNextMonth'
  | 'qualifiedGapNextMonth'
>

const importedMetricLabels: Record<keyof ImportedApmMetrics, string> = {
  nsc: 'NSC',
  nscSum: 'NSC累计',
  netAfycSum: 'AFYC累计',
  netAfyp: 'AFYP',
  netAfypSum: 'AFYP累计',
  netAfypAssigned: 'AFYP assigned',
  netAfypAssignedSum: 'AFYP assigned累计',
  nscHp: 'NSC HP',
  nscHpSum: 'NSC HP累计',
  netAfypHp: 'AFYP HP',
  netAfypHpSum: 'AFYP HP累计',
  netAfypH: 'AFYP H',
  netAfypHSum: 'AFYP H累计',
  netCaseH: 'CASE H',
  netCaseHSum: 'CASE H累计',
  netCase: 'CASE',
  netCaseSum: 'CASE累计',
  netCaseAssigned: 'CASE assigned',
  netCaseAssignedSum: 'CASE assigned累计',
  isQualified: 'QHC',
  isQualifiedAssigned: 'QHC assigned',
  renewalRateTeam: '团队续保率',
}

export function normalizeImportedApmMetrics(
  input: ImportedApmMetrics,
  agentCode: string,
): ImportedApmMetrics {
  return {
    nsc: ensureInteger(input.nsc, `${importedMetricLabels.nsc}: ${agentCode}`),
    nscSum: ensureInteger(input.nscSum, `${importedMetricLabels.nscSum}: ${agentCode}`),
    netAfycSum: ensureInteger(input.netAfycSum, `${importedMetricLabels.netAfycSum}: ${agentCode}`),
    netAfyp: ensureInteger(input.netAfyp, `${importedMetricLabels.netAfyp}: ${agentCode}`),
    netAfypSum: ensureInteger(input.netAfypSum, `${importedMetricLabels.netAfypSum}: ${agentCode}`),
    netAfypAssigned: ensureInteger(input.netAfypAssigned, `${importedMetricLabels.netAfypAssigned}: ${agentCode}`),
    netAfypAssignedSum: ensureInteger(input.netAfypAssignedSum, `${importedMetricLabels.netAfypAssignedSum}: ${agentCode}`),
    nscHp: ensureInteger(input.nscHp, `${importedMetricLabels.nscHp}: ${agentCode}`),
    nscHpSum: ensureInteger(input.nscHpSum, `${importedMetricLabels.nscHpSum}: ${agentCode}`),
    netAfypHp: ensureInteger(input.netAfypHp, `${importedMetricLabels.netAfypHp}: ${agentCode}`),
    netAfypHpSum: ensureInteger(input.netAfypHpSum, `${importedMetricLabels.netAfypHpSum}: ${agentCode}`),
    netAfypH: ensureInteger(input.netAfypH, `${importedMetricLabels.netAfypH}: ${agentCode}`),
    netAfypHSum: ensureInteger(input.netAfypHSum, `${importedMetricLabels.netAfypHSum}: ${agentCode}`),
    netCaseH: ensureInteger(input.netCaseH, `${importedMetricLabels.netCaseH}: ${agentCode}`),
    netCaseHSum: ensureInteger(input.netCaseHSum, `${importedMetricLabels.netCaseHSum}: ${agentCode}`),
    netCase: ensureInteger(input.netCase, `${importedMetricLabels.netCase}: ${agentCode}`),
    netCaseSum: ensureInteger(input.netCaseSum, `${importedMetricLabels.netCaseSum}: ${agentCode}`),
    netCaseAssigned: ensureInteger(input.netCaseAssigned, `${importedMetricLabels.netCaseAssigned}: ${agentCode}`),
    netCaseAssignedSum: ensureInteger(input.netCaseAssignedSum, `${importedMetricLabels.netCaseAssignedSum}: ${agentCode}`),
    isQualified: ensureInteger(input.isQualified, `${importedMetricLabels.isQualified}: ${agentCode}`),
    isQualifiedAssigned: ensureInteger(input.isQualifiedAssigned, `${importedMetricLabels.isQualifiedAssigned}: ${agentCode}`),
    renewalRateTeam: ensureInteger(input.renewalRateTeam, `${importedMetricLabels.renewalRateTeam}: ${agentCode}`),
  }
}

export function createStoredApmMetrics(input: ImportedApmMetrics): StoredApmMetrics {
  return {
    ...input,
    qualifiedGap: null,
    isQualifiedNextMonth: null,
    qualifiedGapNextMonth: null,
  }
}

export function toPerformanceMetrics(row?: PerformanceMetricsSource | null): PerformanceMetrics {
  if (!row) {
    return createEmptyPerformanceMetrics()
  }

  return {
    nsc: row.nsc,
    nscSum: row.nscSum,
    netCase: row.netCase,
    netCaseSum: row.netCaseSum,
    isQualified: Number(row.isQualified) > 0,
    qualifiedGap: row.qualifiedGap,
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
    isQualifiedNextMonth: row.isQualifiedNextMonth == null
      ? null
      : Boolean(row.isQualifiedNextMonth),
    qualifiedGapNextMonth: row.qualifiedGapNextMonth,
  }
}

export function createEmptyPerformanceMetrics(): PerformanceMetrics {
  return {
    nsc: 0,
    nscSum: 0,
    netCase: 0,
    netCaseSum: 0,
    isQualified: false,
    qualifiedGap: null,
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
    isQualifiedNextMonth: null,
    qualifiedGapNextMonth: null,
  }
}
