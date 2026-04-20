import {
  GetAgentPerformanceHistoryQuery,
  ListApmPeriodsQuery,
  ListAvailablePerformanceYearsQuery,
  type Period,
  type PerformanceHistoryItem,
} from "@reeka-office/domain-performance";

export interface AgentPerformanceYearsResult {
  availableYears: number[];
}

export interface AgentPerformanceHistoryResult {
  year: number;
  latestPeriod: Period | null;
  history: PerformanceHistoryItem[];
}

export async function getAgentPerformanceYears(
  agentCode: string,
): Promise<AgentPerformanceYearsResult> {
  return {
    availableYears: await new ListAvailablePerformanceYearsQuery({ agentCode }).query(),
  };
}

export async function getAgentPerformanceHistory(
  agentCode: string,
  year: number,
): Promise<AgentPerformanceHistoryResult> {
  const [latestPeriod, history] = await Promise.all([
    new ListApmPeriodsQuery({ limit: 1 }).query().then(periods => periods[0] ?? null),
    new GetAgentPerformanceHistoryQuery({ agentCode, year }).query(),
  ]);

  return {
    year,
    latestPeriod,
    history,
  };
}
