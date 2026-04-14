import { ListTeamMemberBaseQuery } from "@reeka-office/domain-agent";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getCurrentPerformanceMetrics, type CurrentPerformanceResult } from "./current-performance";
import {
  createMetricsMap,
  normalizeScope,
  presentTeamMembers,
  summarizeTeamMembers,
  type TeamSummary,
} from "./presentation";
import { gegeTeamStatsInputSchema, resolveAccessibleAgentCode } from "./shared";

export type GetTeamStatsInput = z.infer<typeof gegeTeamStatsInputSchema>;

export interface GetTeamStatsOutput {
  latestPeriod: CurrentPerformanceResult["latestPeriod"];
  period: CurrentPerformanceResult["period"];
  scope: "direct" | "all";
  summary: TeamSummary;
}

export const getTeamStats = rpc.define({
  inputSchema: gegeTeamStatsInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetTeamStatsOutput> => {
    const scope = normalizeScope(input.scope);
    const agentCode = await resolveAccessibleAgentCode(context, input.agentCode);
    const members = await new ListTeamMemberBaseQuery({
      leaderCode: agentCode,
      scope,
    }).query();
    const requestedPeriod = input.year != null && input.month != null
      ? {
          year: input.year,
          month: input.month,
        }
      : undefined;
    const metricResult = await getCurrentPerformanceMetrics({
      agentCodes: members.map((member) => member.agentCode),
      period: requestedPeriod,
    });
    const metricsMap = createMetricsMap(metricResult.items);
    const presentedMembers = presentTeamMembers(members, metricsMap);

    return {
      latestPeriod: metricResult.latestPeriod,
      period: metricResult.period,
      scope,
      summary: summarizeTeamMembers(presentedMembers),
    };
  }),
});
