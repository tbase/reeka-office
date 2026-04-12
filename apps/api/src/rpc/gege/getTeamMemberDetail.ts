import {
  GetAgentByCodeQuery,
  GetTeamMemberRelationQuery,
  type AgentProfile,
} from "@reeka-office/domain-agent";
import {
  type PerformanceHistoryItem,
  type PerformanceMetrics,
} from "@reeka-office/domain-performance";
import { createRpcError } from "@reeka-office/jsonrpc";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getCurrentPerformanceMetrics, type CurrentPerformanceResult } from "./current-performance";
import { getAgentPerformanceHistory, getAgentPerformanceYears } from "./history-performance";
import {
  createMetricsMap,
  getMetrics,
  getRelationLabel,
  presentAgentProfile,
  resolveYear,
} from "./presentation";
import { gegeMemberDetailInputSchema, requireAgentCode } from "./shared";

export type GetTeamMemberDetailInput = z.infer<typeof gegeMemberDetailInputSchema>;
export interface GetTeamMemberDetailOutput {
  period: CurrentPerformanceResult["period"];
  availableYears: number[];
  member: AgentProfile & { designationName: string | null };
  relation: {
    hierarchy: number;
    relationLabel: "直属" | "非直属";
  };
  current: PerformanceMetrics;
  history: PerformanceHistoryItem[];
}

export const getTeamMemberDetail = rpc.define({
  inputSchema: gegeMemberDetailInputSchema,
  execute: mustAgent(async ({ context, input }): Promise<GetTeamMemberDetailOutput> => {
    const leaderCode = requireAgentCode(context);
    const relation = await new GetTeamMemberRelationQuery({
      leaderCode,
      agentCode: input.agentCode,
    }).query();

    if (!relation) {
      throw createRpcError.forbidden("仅可查看团队成员业绩");
    }

    const member = await new GetAgentByCodeQuery({
      agentCode: input.agentCode,
    }).query();

    if (!member) {
      throw createRpcError.forbidden("仅可查看团队成员业绩");
    }

    const [metaResult, currentResult] = await Promise.all([
      getAgentPerformanceYears(input.agentCode),
      getCurrentPerformanceMetrics({
        agentCodes: [input.agentCode],
      }),
    ]);

    const selectedYear = resolveYear(
      metaResult.availableYears,
      input.year,
      currentResult.period,
    );
    const historyResult = await getAgentPerformanceHistory(input.agentCode, selectedYear);
    const metricsMap = createMetricsMap(currentResult.items);

    return {
      period: currentResult.period,
      availableYears: metaResult.availableYears,
      member: presentAgentProfile(member),
      relation: {
        hierarchy: relation.hierarchy,
        relationLabel: getRelationLabel(relation.hierarchy),
      },
      current: getMetrics(metricsMap, input.agentCode),
      history: historyResult.history,
    };
  }),
});
