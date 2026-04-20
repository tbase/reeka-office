import {
  GetMonthlyMetricValuesQuery,
  type MonthlyMetricValueItem,
  type PerformanceMetricName,
} from "@reeka-office/domain-performance";

export interface MonthlyMetricValuesInput {
  agentCodes: string[];
  year: number;
  metricName: PerformanceMetricName;
}

export interface MonthlyMetricValuesResult {
  year: number;
  metricName: PerformanceMetricName;
  items: MonthlyMetricValueItem[];
}

export async function getMonthlyMetricValues(
  input: MonthlyMetricValuesInput,
): Promise<MonthlyMetricValuesResult> {
  return {
    year: input.year,
    metricName: input.metricName,
    items: await new GetMonthlyMetricValuesQuery(input).query(),
  };
}
