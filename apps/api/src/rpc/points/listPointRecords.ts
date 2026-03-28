import {
  ListAgentPointRecordsQuery,
  ListAgentRedemptionRecordsQuery
} from "@reeka-office/domain-point";
import type { z } from "zod";

import { mustAgent, rpc } from "../../context";
import {
  agentInputSchema,
  formatDateTime
} from "./shared";

export type ListPointRecordsInput = z.infer<typeof agentInputSchema>;

export type ListPointRecordsOutput = Array<{
  id: string;
  title: string;
  scene: string;
  points: number;
  date: string;
  type: "grant" | "redeem";
  expired: boolean;
  note: string;
}>;

export const listPointRecords = rpc.define({
  inputSchema: agentInputSchema,
  execute: mustAgent(async ({ context }): Promise<ListPointRecordsOutput> => {
    const [pointResult, redemptionResult] = await Promise.all([
      new ListAgentPointRecordsQuery({
        agentId: context.agent.agentId,
      }).query(),
      new ListAgentRedemptionRecordsQuery({
        agentId: context.agent.agentId,
      }).query(),
    ]);

    const records = [
      ...pointResult.records.map((record) => {
        const note = record.remark ?? "系统自动发放";
        const expired = note.includes("过期");

        return {
          id: `point-${record.id}`,
          title: record.pointItemName,
          scene: record.pointItemCategory,
          points: record.points,
          date: formatDateTime(record.createdAt),
          type: "grant" as const,
          expired,
          note,
          sortTime: new Date(record.createdAt).getTime(),
        };
      }),
      ...redemptionResult.records
        .filter((record) => record.status === "success")
        .map((record) => ({
          id: `redeem-${record.id}`,
          title: record.productTitle,
          scene: record.redeemCategory,
          points: -record.pointsCost,
          date: formatDateTime(record.redeemedAt),
          type: "redeem" as const,
          expired: false,
          note: record.remark ?? "积分兑换",
          sortTime: new Date(record.redeemedAt).getTime(),
        })),
    ];

    return records
      .sort((a, b) => b.sortTime - a.sortTime)
      .map(({ sortTime: _sortTime, ...record }) => record);
  }),
});
