import {
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
import { buildTeamMeta, getTeamAgent, listMembersByScope } from "./team-scope";

export interface GetDashboardOutput {
  period: CurrentPerformanceResult["period"];
  agent: AgentProfile & { designationName: string | null };
  self: PerformanceMetrics;
  team: {
    direct: TeamSummary;
    division: TeamSummary | null;
    all: TeamSummary;
  };
}

export const getDashboard = rpc.define({
  inputSchema: gegeDashboardInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetDashboardOutput> => {
    const effectiveAgentCode = await resolveAccessibleAgentCode(context, input?.agentCode);
    const agent = await getTeamAgent(effectiveAgentCode);
    const teamMeta = buildTeamMeta(agent);
    const [directMembers, divisionMembers, allMembers] = await Promise.all([
      new ListTeamMemberBaseQuery({
        leaderCode: effectiveAgentCode,
        scope: "direct",
      }).query(),
      teamMeta.availableScopes.some((option) => option.scope === "division")
        ? listMembersByScope(agent, "division")
        : Promise.resolve([]),
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
          ...divisionMembers.map((member) => member.agentCode),
          ...allMembers.map((member) => member.agentCode),
        ]),
      ],
    });
    const metricsMap = createMetricsMap(metricResult.items);
    const self = getMetrics(metricsMap, effectiveAgentCode);
    const presentedDirectMembers = presentTeamMembers(directMembers, metricsMap);
    const presentedDivisionMembers = presentTeamMembers(divisionMembers, metricsMap);
    const presentedAllMembers = presentTeamMembers(allMembers, metricsMap);

    return {
      period: metricResult.period,
      agent: presentAgentProfile(agent),
      self,
      team: {
        direct: summarizeTeamMembers(presentedDirectMembers, self),
        division: teamMeta.availableScopes.some((option) => option.scope === "division")
          ? summarizeTeamMembers(presentedDivisionMembers, self)
          : null,
        all: summarizeTeamMembers(presentedAllMembers, self),
      },
    };
  }),
});
