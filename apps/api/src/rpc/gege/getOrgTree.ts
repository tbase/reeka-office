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
  directReportCount: number;
  directLineCount: number;
  totalMemberCount: number;
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
    directReportCount: 0,
    directLineCount: 0,
    totalMemberCount: 0,
    children: [],
  };
}

function isDesignationAboveUm(designationName: string | null): boolean {
  return designationName != null && !["LA", "FC", "UM"].includes(designationName);
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

  function getDirectLineContribution(node: OrgTreeNode): number {
    if (isDesignationAboveUm(node.designationName)) {
      return 1;
    }

    return 1 + node.children.reduce((count, childNode) => {
      return count + getDirectLineContribution(childNode);
    }, 0);
  }

  function populateCounts(node: OrgTreeNode): number {
    node.directReportCount = node.children.length;

    node.totalMemberCount = node.children.reduce((count, childNode) => {
      return count + 1 + populateCounts(childNode);
    }, 0);

    node.directLineCount = node.children.reduce((count, childNode) => {
      return count + getDirectLineContribution(childNode);
    }, 0);

    return node.totalMemberCount;
  }

  attachChildren(root);
  populateCounts(root);

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
