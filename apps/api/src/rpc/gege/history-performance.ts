import {
  getDb,
  ListApmPeriodsQuery,
  listAgentPerformanceHistory,
  listAvailablePerformanceYears,
  type ApmPeriod,
  type PerformanceHistoryItem,
} from "@reeka-office/domain-performance";

export interface AgentPerformanceYearsResult {
  availableYears: number[];
}

export interface AgentPerformanceHistoryResult {
  year: number;
  latestPeriod: ApmPeriod | null;
  history: PerformanceHistoryItem[];
}

export async function getAgentPerformanceYears(
  agentCode: string,
): Promise<AgentPerformanceYearsResult> {
  return {
    availableYears: await listAvailablePerformanceYears(getDb(), agentCode),
  };
}

export async function getAgentPerformanceHistory(
  agentCode: string,
  year: number,
): Promise<AgentPerformanceHistoryResult> {
  const [latestPeriod, history] = await Promise.all([
    new ListApmPeriodsQuery({ limit: 1 }).query().then(periods => periods[0] ?? null),
    listAgentPerformanceHistory(getDb(), agentCode, year),
  ]);

  return {
    year,
    latestPeriod,
    history,
  };
}
