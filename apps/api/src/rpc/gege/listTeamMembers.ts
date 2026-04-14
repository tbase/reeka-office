import { ListTeamMemberBaseQuery } from "@reeka-office/domain-agent";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getCurrentPerformanceMetrics } from "./current-performance";
import {
  createMetricsMap,
  normalizeScope,
  presentTeamMembers,
  type PresentedTeamMember,
} from "./presentation";
import { gegeListTeamMembersInputSchema, resolveAccessibleAgentCode } from "./shared";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;

export type ListTeamMembersInput = z.infer<typeof gegeListTeamMembersInputSchema>;
export interface ListTeamMembersOutput {
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
  members: PresentedTeamMember[];
}

export const listTeamMembers = rpc.define({
  inputSchema: gegeListTeamMembersInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<ListTeamMembersOutput> => {
    const scope = normalizeScope(input.scope);
    const page = input.page ?? DEFAULT_PAGE;
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
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
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      page,
      pageSize,
      total: presentedMembers.length,
      hasMore: end < presentedMembers.length,
      members: presentedMembers.slice(start, end),
    };
  }),
});
