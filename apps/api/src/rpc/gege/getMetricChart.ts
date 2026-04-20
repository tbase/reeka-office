import { ListTeamMemberBaseQuery } from "@reeka-office/domain-agent";
import {
  ListApmPeriodsQuery,
  type Period,
} from "@reeka-office/domain-performance";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getMonthlyMetricValues } from "./monthly-metric-values";
import { gegeMetricChartInputSchema, resolveAccessibleAgentCode } from "./shared";

export type GetMetricChartInput = z.infer<typeof gegeMetricChartInputSchema>;
export interface GetMetricChartOutput {
  period: Period | null;
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
    const targetAgentCode = await resolveAccessibleAgentCode(context, input.agentCode);
    const agentCodes = input.scope === "self"
      ? [targetAgentCode]
      : (await new ListTeamMemberBaseQuery({
          leaderCode: targetAgentCode,
          scope: input.scope === "direct" ? "direct" : "all",
        }).query()).map((member) => member.agentCode);

    const [period, result] = await Promise.all([
      new ListApmPeriodsQuery({ limit: 1 }).query().then(periods => periods[0] ?? null),
      getMonthlyMetricValues({
        agentCodes,
        year: input.year,
        metricName: input.metricName,
      }),
    ]);

    return {
      period,
      year: input.year,
      metricName: input.metricName,
      scope: input.scope,
      points: result.items.map((item) => ({
        month: item.month,
        value: item.value,
      })),
    };
  }),
});
