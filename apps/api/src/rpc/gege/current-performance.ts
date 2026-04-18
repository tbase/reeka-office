import {
  getDb,
  ListApmPeriodsQuery,
  listCurrentPerformanceMetrics,
  type ApmPeriod,
  type CurrentPerformanceMetricItem,
} from "@reeka-office/domain-performance";

export interface CurrentPerformanceInput {
  agentCodes: string[];
  period?: ApmPeriod | null;
}

export interface CurrentPerformanceResult {
  latestPeriod: ApmPeriod | null;
  period: ApmPeriod | null;
  items: CurrentPerformanceMetricItem[];
}

export async function getCurrentPerformanceMetrics(
  input: CurrentPerformanceInput,
): Promise<CurrentPerformanceResult> {
  const latestPeriod = (await new ListApmPeriodsQuery({ limit: 1 }).query())[0] ?? null
  const period = input.period ?? latestPeriod;

  return {
    latestPeriod,
    period,
    items: await listCurrentPerformanceMetrics(getDb(), input.agentCodes, period),
  };
}
