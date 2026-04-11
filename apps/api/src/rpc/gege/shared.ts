import { createRpcError } from "@reeka-office/jsonrpc";
import { z } from "zod";

import type { AgentContext } from "../../context";

const AGENT_CODE_REGEX = /^[A-Za-z0-9]{8}$/;

export const gegeYearInputSchema = z.object({
  year: z.number().int().min(2000).max(2100).optional(),
});

export const gegeTeamScopeSchema = z.enum(["direct", "all"]);
export const gegeMetricScopeSchema = z.enum(["self", "direct", "all"]);
export const gegeMetricNameSchema = z.enum(["nsc", "netCase"]);

export const gegeTeamMembersInputSchema = z.object({
  scope: gegeTeamScopeSchema.optional(),
});

export const gegeMetricChartInputSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  metricName: gegeMetricNameSchema,
  scope: gegeMetricScopeSchema,
});

export const gegeMemberDetailInputSchema = z.object({
  agentCode: z.string().regex(AGENT_CODE_REGEX),
  year: z.number().int().min(2000).max(2100).optional(),
});

export function requireAgentCode(context: AgentContext): string {
  const agentCode = context.agent.agentCode?.trim();

  if (!agentCode) {
    throw createRpcError.internalError("代理人编码不存在");
  }

  return agentCode;
}
