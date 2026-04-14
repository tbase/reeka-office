import {
  GetAgentByCodeQuery,
  ListTeamMemberBaseQuery,
  type AgentProfile,
} from "@reeka-office/domain-agent";
import {
  type PerformanceMetrics,
} from "@reeka-office/domain-performance";

import { mustAgent, rpc } from "../../context";
import { getCurrentPerformanceMetrics, type CurrentPerformanceResult } from "./current-performance";
import {
  createMetricsMap,
  getMetrics,
  presentAgentProfile,
  presentTeamMembers,
  summarizeTeamMembers,
  type TeamSummary,
} from "./presentation";
import { gegeDashboardInputSchema, resolveAccessibleAgentCode } from "./shared";

export interface GetDashboardOutput {
  period: CurrentPerformanceResult["period"];
  agent: AgentProfile & { designationName: string | null };
  self: PerformanceMetrics;
  team: {
    direct: TeamSummary;
    all: TeamSummary;
  };
}

export const getDashboard = rpc.define({
  inputSchema: gegeDashboardInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetDashboardOutput> => {
    const effectiveAgentCode = await resolveAccessibleAgentCode(context, input?.agentCode);

    const agent = await new GetAgentByCodeQuery({ agentCode: effectiveAgentCode }).query();

    if (!agent) {
      throw new Error(`代理人不存在: ${effectiveAgentCode}`);
    }

    const [directMembers, allMembers] = await Promise.all([
      new ListTeamMemberBaseQuery({
        leaderCode: effectiveAgentCode,
        scope: "direct",
      }).query(),
      new ListTeamMemberBaseQuery({
        leaderCode: effectiveAgentCode,
        scope: "all",
      }).query(),
    ]);

    const metricResult = await getCurrentPerformanceMetrics({
      agentCodes: [
        effectiveAgentCode,
        ...new Set([
          ...directMembers.map((member) => member.agentCode),
          ...allMembers.map((member) => member.agentCode),
        ]),
      ],
    });
    const metricsMap = createMetricsMap(metricResult.items);
    const presentedDirectMembers = presentTeamMembers(directMembers, metricsMap);
    const presentedAllMembers = presentTeamMembers(allMembers, metricsMap);

    return {
      period: metricResult.period,
      agent: presentAgentProfile(agent),
      self: getMetrics(metricsMap, effectiveAgentCode),
      team: {
        direct: summarizeTeamMembers(presentedDirectMembers),
        all: summarizeTeamMembers(presentedAllMembers),
      },
    };
  }),
});
