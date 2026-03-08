import { GetNewbieTaskCheckinQuery, SubmitNewbieTaskCheckinCommand } from "@reeka-office/domain-newbie";
import { createRpcError } from "@reeka-office/jsonrpc";
import { z } from "zod";

import { rpc } from "../../context";
import { normalizeImageURL } from "../../lib/image-url";
import { newbieCheckinOutputSchema } from "./shared";

const inputSchema = z.object({
  taskId: z.coerce.number().int().positive(),
  evidenceFileIds: z.array(z.string().min(1)).max(3).default([]),
});

export type SubmitCheckinInput = z.infer<typeof inputSchema>;
export type SubmitCheckinOutput = z.infer<typeof newbieCheckinOutputSchema>;

export const submitCheckin = rpc.define({
  inputSchema,
  execute: async ({ input, context }): Promise<SubmitCheckinOutput> => {
    const agentCode = context.user!.agentCode!;
    const evidenceFileIds = input.evidenceFileIds.map(normalizeImageURL) as string[]

    await new SubmitNewbieTaskCheckinCommand({
      agentCode,
      taskId: input.taskId,
      evidenceFileIds,
    }).execute();

    const checkin = await new GetNewbieTaskCheckinQuery({
      agentCode,
      taskId: input.taskId,
    }).query();

    if (!checkin) {
      throw createRpcError.internalError("打卡提交成功，但读取结果失败");
    }

    return {
      taskId: checkin.taskId,
      checkedInAt: checkin.createdAt.toISOString(),
      evidenceFileIds: checkin.evidenceFileIds,
    };
  },
});
