import { createRpcError } from "@reeka-office/jsonrpc";
import { z } from "zod";
import { GetTeamMemberRelationQuery } from "@reeka-office/domain-agent";

import type { AgentContext } from "../../context";

const AGENT_CODE_REGEX = /^[A-Za-z0-9]{8}$/;
const gegeAgentCodeInputSchema = z.object({
  agentCode: z.string().regex(AGENT_CODE_REGEX).optional(),
});

export const gegeYearInputSchema = gegeAgentCodeInputSchema.extend({
  year: z.number().int().min(2000).max(2100).optional(),
});

export const gegeTeamScopeSchema = z.enum(["direct", "division", "all"]);
export const gegeMetricScopeSchema = z.enum(["self", "direct", "all"]);
export const gegeMetricNameSchema = z.enum(["nsc", "netCase"]);
export const gegeTeamMemberSortFieldSchema = z.enum([
  "designation",
  "nsc",
  "nscSum",
  "netCase",
  "netCaseSum",
]);
export const gegeSortDirectionSchema = z.enum(["asc", "desc"]);
export type GegeTeamScope = z.infer<typeof gegeTeamScopeSchema>;
export type GegeTeamMemberSortField = z.infer<typeof gegeTeamMemberSortFieldSchema>;
export type GegeSortDirection = z.infer<typeof gegeSortDirectionSchema>;

const gegeTeamFiltersInputSchema = gegeAgentCodeInputSchema.extend({
  scope: gegeTeamScopeSchema.optional(),
  year: z.number().int().min(2000).max(2100).optional(),
  month: z.number().int().min(1).max(12).optional(),
}).refine(
  input => (input.year == null) === (input.month == null),
  {
    message: "year 和 month 需要同时传入",
    path: ["month"],
  },
);

export const gegeTeamStatsInputSchema = gegeTeamFiltersInputSchema;

export const gegeListTeamMembersInputSchema = gegeTeamFiltersInputSchema.extend({
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
  sortField: gegeTeamMemberSortFieldSchema.optional(),
  sortDirection: gegeSortDirectionSchema.optional(),
}).refine(
  input => (input.sortField == null) === (input.sortDirection == null),
  {
    message: "sortField 和 sortDirection 需要同时传入",
    path: ["sortDirection"],
  },
);

export const gegeSearchAgentsInputSchema = gegeAgentCodeInputSchema.extend({
  keyword: z.string(),
  limit: z.number().int().min(1).max(50).optional(),
});

export const gegeMetricChartInputSchema = gegeAgentCodeInputSchema.extend({
  year: z.number().int().min(2000).max(2100),
  metricName: gegeMetricNameSchema,
  scope: gegeMetricScopeSchema,
});

export const gegeDashboardInputSchema = gegeAgentCodeInputSchema.optional();
export const gegeAgentLogsInputSchema = gegeAgentCodeInputSchema.extend({
  category: z.enum(["all", "profile", "apm"]).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  limit: z.number().int().min(1).max(100).optional(),
}).optional();

export function requireAgentCode(context: AgentContext): string {
  const agentCode = context.agent.agentCode?.trim();

  if (!agentCode) {
    throw createRpcError.internalError("代理人编码不存在");
  }

  return agentCode;
}

export async function resolveAccessibleAgentCode(
  context: AgentContext,
  requestedAgentCode: string | null | undefined,
): Promise<string> {
  const currentAgentCode = requireAgentCode(context);
  const normalizedRequestedAgentCode = requestedAgentCode?.trim().toUpperCase();

  if (!normalizedRequestedAgentCode || normalizedRequestedAgentCode === currentAgentCode) {
    return currentAgentCode;
  }

  const relation = await new GetTeamMemberRelationQuery({
    leaderCode: currentAgentCode,
    agentCode: normalizedRequestedAgentCode,
  }).query();

  if (!relation) {
    throw createRpcError.forbidden(
      "仅可查看当前代理人本人或下属业绩",
      { kind: "business", reason: "INVALID_AGENT_TARGET" },
    );
  }

  return normalizedRequestedAgentCode;
}
