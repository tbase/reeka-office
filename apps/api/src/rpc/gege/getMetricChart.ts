import { ListAgentMonthlyMetricsQuery } from "@reeka-office/domain-performance";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { gegeMetricChartInputSchema, requireAgentCode } from "./shared";

export type GetMetricChartInput = z.infer<typeof gegeMetricChartInputSchema>;
export interface GetMetricChartOutput {
  period: Awaited<ReturnType<ListAgentMonthlyMetricsQuery["query"]>>["period"];
  year: number;
  metricName: GetMetricChartInput["metricName"];
  scope: GetMetricChartInput["scope"];
  points: Array<{
    month: number;
    value: number;
  }>;
}

export const getMetricChart = rpc.define({
  inputSchema: gegeMetricChartInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetMetricChartOutput> => {
    const result = await new ListAgentMonthlyMetricsQuery({
      agentCode: requireAgentCode(context),
      year: input.year,
      metricName: input.metricName,
      scope: input.scope,
    }).query();

    return {
      period: result.period,
      year: result.year,
      metricName: result.metricName,
      scope: result.scope,
      points: result.items.map((item) => ({
        month: item.month,
        value: item.value,
      })),
    };
  }),
});
