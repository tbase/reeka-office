import type { z } from "zod";

import { getDesignationName } from "@reeka-office/domain-agent";

import { mustAgent, rpc } from "../../context";
import { gegeSearchAgentsInputSchema, resolveAccessibleAgentCode } from "./shared";
import { getTeamAgent, listMembersByScope } from "./team-scope";

const DEFAULT_LIMIT = 20;

export interface SearchAgentItem {
  agentCode: string;
  name: string;
  designationName: string | null;
  leaderCode: string | null;
  hierarchy: number;
}

export interface SearchAgentsOutput {
  agents: SearchAgentItem[];
}

export type SearchAgentsInput = z.infer<typeof gegeSearchAgentsInputSchema>;

function normalizeKeyword(value: string): string {
  return value.trim().toUpperCase();
}

function matchesKeyword(agent: Pick<SearchAgentItem, "agentCode" | "name">, keyword: string): boolean {
  return agent.agentCode.toUpperCase().includes(keyword)
    || agent.name.trim().toUpperCase().includes(keyword);
}

export const searchAgents = rpc.define({
  inputSchema: gegeSearchAgentsInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<SearchAgentsOutput> => {
    const keyword = normalizeKeyword(input.keyword);

    if (keyword.length < 2) {
      return {
        agents: [],
      };
    }

    const limit = input.limit ?? DEFAULT_LIMIT;
    const effectiveAgentCode = await resolveAccessibleAgentCode(context, input.agentCode);
    const agent = await getTeamAgent(effectiveAgentCode);
    const members = await listMembersByScope(agent, "all");
    const searchableAgents: SearchAgentItem[] = [
      {
        agentCode: agent.agentCode,
        name: agent.name,
        designationName: getDesignationName(agent.designation),
        leaderCode: agent.leaderCode,
        hierarchy: 0,
      },
      ...members.map((member) => ({
        agentCode: member.agentCode,
        name: member.name,
        designationName: getDesignationName(member.designation),
        leaderCode: member.leaderCode,
        hierarchy: member.hierarchy,
      })),
    ];

    return {
      agents: searchableAgents
        .filter(agentItem => matchesKeyword(agentItem, keyword))
        .sort((left, right) => {
          if (left.hierarchy !== right.hierarchy) {
            return left.hierarchy - right.hierarchy;
          }

          const nameComparison = left.name.localeCompare(right.name);

          if (nameComparison !== 0) {
            return nameComparison;
          }

          return left.agentCode.localeCompare(right.agentCode);
        })
        .slice(0, limit),
    };
  }),
});
