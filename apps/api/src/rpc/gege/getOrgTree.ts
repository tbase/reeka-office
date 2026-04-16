import {
  GetAgentByCodeQuery,
  getDesignationName,
  ListTeamMemberBaseQuery,
  type AgentProfile,
  type TeamMemberBaseItem,
} from "@reeka-office/domain-agent";

import { mustAgent, rpc } from "../../context";
import { gegeDashboardInputSchema, resolveAccessibleAgentCode } from "./shared";

export interface OrgTreeNode {
  agentCode: string;
  name: string;
  designationName: string | null;
  hierarchy: number;
  children: OrgTreeNode[];
}

export interface GetOrgTreeOutput {
  root: OrgTreeNode;
  totalMembers: number;
  maxDepth: number;
}

function createOrgTreeNode(
  agent: Pick<AgentProfile, "agentCode" | "name" | "designation">,
  hierarchy: number,
): OrgTreeNode {
  return {
    agentCode: agent.agentCode,
    name: agent.name,
    designationName: getDesignationName(agent.designation),
    hierarchy,
    children: [],
  };
}

function buildOrgTree(
  rootAgent: AgentProfile,
  members: TeamMemberBaseItem[],
): GetOrgTreeOutput {
  const root = createOrgTreeNode(rootAgent, 0);
  const childrenByLeaderCode = new Map<string, TeamMemberBaseItem[]>();

  for (const member of members) {
    const leaderCode = member.leaderCode?.trim();

    if (!leaderCode) {
      continue;
    }

    const siblings = childrenByLeaderCode.get(leaderCode) ?? [];
    siblings.push(member);
    childrenByLeaderCode.set(leaderCode, siblings);
  }

  function attachChildren(node: OrgTreeNode): void {
    const children = childrenByLeaderCode.get(node.agentCode) ?? [];

    node.children = children.map((member) => {
      const childNode = createOrgTreeNode(member, member.hierarchy);
      attachChildren(childNode);
      return childNode;
    });
  }

  function getMaxDepth(node: OrgTreeNode): number {
    if (node.children.length === 0) {
      return node.hierarchy;
    }

    return node.children.reduce((maxDepth, childNode) => {
      return Math.max(maxDepth, getMaxDepth(childNode));
    }, node.hierarchy);
  }

  attachChildren(root);

  return {
    root,
    totalMembers: members.length,
    maxDepth: getMaxDepth(root),
  };
}

export const getOrgTree = rpc.define({
  inputSchema: gegeDashboardInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetOrgTreeOutput> => {
    const effectiveAgentCode = await resolveAccessibleAgentCode(context, input?.agentCode);
    const rootAgent = await new GetAgentByCodeQuery({ agentCode: effectiveAgentCode }).query();

    if (!rootAgent) {
      throw new Error(`代理人不存在: ${effectiveAgentCode}`);
    }

    const members = await new ListTeamMemberBaseQuery({
      leaderCode: effectiveAgentCode,
      scope: "all",
    }).query();

    return buildOrgTree(rootAgent, members);
  }),
});
