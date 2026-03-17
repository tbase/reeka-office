import { ListAgentPointRecordsQuery } from "@reeka-office/domain-point";
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
  expired: boolean;
  note: string;
}>;

export const listPointRecords = rpc.define({
  inputSchema: agentInputSchema,
  execute: mustAgent(async ({ context }): Promise<ListPointRecordsOutput> => {
    const result = await new ListAgentPointRecordsQuery({
      agentId: context.agent.agentId,
    }).query();

    return result.records.map((record) => {
      const note = record.remark ?? "系统自动结算";
      const expired = note.includes("过期") || record.points < 0;

      return {
        id: String(record.id),
        title: record.pointItemName,
        scene: record.pointItemCategory,
        points: record.points,
        date: formatDateTime(record.createdAt),
        expired,
        note,
      };
    });
  }),
});
