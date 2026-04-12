import { ListTeamMemberBaseQuery } from "@reeka-office/domain-agent";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getCurrentPerformanceMetrics, type CurrentPerformanceResult } from "./current-performance";
import {
  createMetricsMap,
  normalizeScope,
  presentTeamMembers,
  summarizeTeamMembers,
  type PresentedTeamMember,
  type TeamSummary,
} from "./presentation";
import { gegeTeamMembersInputSchema, requireAgentCode } from "./shared";

export type ListTeamMembersInput = z.infer<typeof gegeTeamMembersInputSchema>;
export interface ListTeamMembersOutput {
  latestPeriod: CurrentPerformanceResult["latestPeriod"];
  period: CurrentPerformanceResult["period"];
  scope: "direct" | "all";
  summary: TeamSummary;
  members: PresentedTeamMember[];
}

export const listTeamMembers = rpc.define({
  inputSchema: gegeTeamMembersInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<ListTeamMembersOutput> => {
    const scope = normalizeScope(input.scope);
    const members = await new ListTeamMemberBaseQuery({
      leaderCode: requireAgentCode(context),
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
      members: presentedMembers,
    };
  }),
});
