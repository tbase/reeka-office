import { ListTeamMemberBaseQuery } from "@reeka-office/domain-agent";
import {
  GetLatestApmPeriodQuery,
} from "@reeka-office/domain-performance";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getMonthlyMetricValues } from "./monthly-metric-values";
import { normalizeScope } from "./presentation";
import { gegeMetricChartInputSchema, requireAgentCode } from "./shared";

export type GetMetricChartInput = z.infer<typeof gegeMetricChartInputSchema>;
export interface GetMetricChartOutput {
  period: Awaited<ReturnType<GetLatestApmPeriodQuery["query"]>>;
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
    const agentCode = requireAgentCode(context);
    const agentCodes = input.scope === "self"
      ? [agentCode]
      : (await new ListTeamMemberBaseQuery({
          leaderCode: agentCode,
          scope: normalizeScope(input.scope),
        }).query()).map((member) => member.agentCode);

    const [period, result] = await Promise.all([
      new GetLatestApmPeriodQuery().query(),
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
