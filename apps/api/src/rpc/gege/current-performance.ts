import {
  GetCurrentPerformanceMetricsQuery,
  ListApmPeriodsQuery,
  type Period,
  type CurrentPerformanceMetricItem,
} from "@reeka-office/domain-performance";

export interface CurrentPerformanceInput {
  agentCodes: string[];
  period?: Period | null;
}

export interface CurrentPerformanceResult {
  latestPeriod: Period | null;
  period: Period | null;
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
    items: await new GetCurrentPerformanceMetricsQuery({
      agentCodes: input.agentCodes,
      period,
    }).query(),
  };
}
