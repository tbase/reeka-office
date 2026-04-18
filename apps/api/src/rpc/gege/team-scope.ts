import {
  GetAgentByCodeQuery,
  getDesignationName,
  getDesignationValue,
  ListTeamMemberBaseQuery,
  type AgentProfile,
  type TeamMemberBaseItem,
} from "@reeka-office/domain-agent";

import type { GegeTeamScope } from "./shared";

const RM_DESIGNATION_VALUE = getDesignationValue("RM") ?? 5;

export interface TeamScopeOption {
  scope: GegeTeamScope;
  label: string;
}

export interface TeamMeta {
  designationName: string | null;
  division: string | null;
  availableScopes: TeamScopeOption[];
  defaultScope: "direct";
}

export function normalizeDivision(division: string | null | undefined): string | null {
  const normalizedDivision = division?.trim();

  return normalizedDivision ? normalizedDivision : null;
}

export function canAccessDivisionTeam(agent: Pick<AgentProfile, "designation" | "division">): boolean {
  const division = normalizeDivision(agent.division);

  return division != null
    && agent.designation != null
    && agent.designation > RM_DESIGNATION_VALUE;
}

export function buildTeamMeta(agent: AgentProfile): TeamMeta {
  const division = normalizeDivision(agent.division);
  const designationName = getDesignationName(agent.designation);
  const availableScopes: TeamScopeOption[] = [
    {
      scope: "direct",
      label: "直属",
    },
  ];

  if (canAccessDivisionTeam(agent) && division) {
    availableScopes.push({
      scope: "division",
      label: division,
    });
  }

  availableScopes.push({
    scope: "all",
    label: "全团队",
  });

  return {
    designationName,
    division,
    availableScopes,
    defaultScope: "direct",
  };
}

export function normalizeTeamScope(
  scope: GegeTeamScope | undefined,
  teamMeta: TeamMeta,
): GegeTeamScope {
  if (!scope) {
    return teamMeta.defaultScope;
  }

  return teamMeta.availableScopes.some((option) => option.scope === scope)
    ? scope
    : teamMeta.defaultScope;
}

export async function getTeamAgent(agentCode: string): Promise<AgentProfile> {
  const agent = await new GetAgentByCodeQuery({ agentCode }).query();

  if (!agent) {
    throw new Error(`代理人不存在: ${agentCode}`);
  }

  return agent;
}

export async function listMembersByScope(
  agent: AgentProfile,
  scope: GegeTeamScope,
): Promise<TeamMemberBaseItem[]> {
  if (scope === "division") {
    const division = normalizeDivision(agent.division);

    if (!canAccessDivisionTeam(agent) || !division) {
      return [];
    }

    return new ListTeamMemberBaseQuery({
      agentCode: agent.agentCode,
      division,
      scope: "division",
    }).query();
  }

  return new ListTeamMemberBaseQuery({
    leaderCode: agent.agentCode,
    scope,
  }).query();
}
