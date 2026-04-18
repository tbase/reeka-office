import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getCurrentPerformanceMetrics } from "./current-performance";
import {
  createMetricsMap,
  presentTeamMembers,
  sortPresentedTeamMembers,
  sortPresentedTeamMembersByDefault,
  type PresentedTeamMember,
} from "./presentation";
import { gegeListTeamMembersInputSchema, resolveAccessibleAgentCode } from "./shared";
import { buildTeamMeta, getTeamAgent, listMembersByScope, normalizeTeamScope } from "./team-scope";

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
    const page = input.page ?? DEFAULT_PAGE;
    const pageSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
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
      agentCodes: members.map((member) => member.agentCode),
      period: requestedPeriod,
    });
    const metricsMap = createMetricsMap(metricResult.items);
    const presentedMembers = presentTeamMembers(members, metricsMap);
    const sortedMembers = input.sortField != null && input.sortDirection != null
      ? sortPresentedTeamMembers(presentedMembers, {
          field: input.sortField,
          direction: input.sortDirection,
        })
      : sortPresentedTeamMembersByDefault(presentedMembers);
    const start = (page - 1) * pageSize;
    const end = start + pageSize;

    return {
      page,
      pageSize,
      total: sortedMembers.length,
      hasMore: end < sortedMembers.length,
      members: sortedMembers.slice(start, end),
    };
  }),
});
