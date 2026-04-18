import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getCurrentPerformanceMetrics, type CurrentPerformanceResult } from "./current-performance";
import {
  createMetricsMap,
  getMetrics,
  presentTeamMembers,
  summarizeTeamMembers,
  type TeamSummary,
} from "./presentation";
import { gegeTeamStatsInputSchema, resolveAccessibleAgentCode } from "./shared";
import { buildTeamMeta, getTeamAgent, listMembersByScope, normalizeTeamScope } from "./team-scope";

export type GetTeamStatsInput = z.infer<typeof gegeTeamStatsInputSchema>;

export interface GetTeamStatsOutput {
  latestPeriod: CurrentPerformanceResult["latestPeriod"];
  period: CurrentPerformanceResult["period"];
  scope: "direct" | "division" | "all";
  summary: TeamSummary;
}

export const getTeamStats = rpc.define({
  inputSchema: gegeTeamStatsInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetTeamStatsOutput> => {
    const agentCode = await resolveAccessibleAgentCode(context, input.agentCode);
    const agent = await getTeamAgent(agentCode);
    const scope = normalizeTeamScope(input.scope, buildTeamMeta(agent));
    const members = await listMembersByScope(agent, scope);
    const requestedPeriod = input.year != null && input.month != null
      ? {
          year: input.year,
          month: input.month,
        }
      : undefined;
    const metricResult = await getCurrentPerformanceMetrics({
      agentCodes: [
        agentCode,
        ...members.map((member) => member.agentCode),
      ],
      period: requestedPeriod,
    });
    const metricsMap = createMetricsMap(metricResult.items);
    const self = getMetrics(metricsMap, agentCode);
    const presentedMembers = presentTeamMembers(members, metricsMap);

    return {
      latestPeriod: metricResult.latestPeriod,
      period: metricResult.period,
      scope,
      summary: summarizeTeamMembers(presentedMembers, self),
    };
  }),
});
