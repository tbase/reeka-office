import { createRpcError } from "@reeka-office/jsonrpc";
import { GetNewbieTaskCheckinQuery, GetNewbieTaskQuery } from "@reeka-office/domain-newbie";
import { z } from "zod";

import { rpc } from "../../context";

const inputSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type GetNewbieTaskDetailInput = z.infer<typeof inputSchema>;

export interface GetNewbieTaskDetailOutput {
  id: number;
  title: string;
  description: string | null;
  categoryName: string;
  pointAmount: number | null;
  pointEventId: number;
  displayOrder: number;
  stage: string;
  stageTitle: string;
  isCheckedIn: boolean;
  checkedInAt: string | null;
  evidenceFileIds: string[];
}

export const getTaskDetail = rpc.define({
  inputSchema,
  execute: async ({ input, context }): Promise<GetNewbieTaskDetailOutput> => {
    const task = await new GetNewbieTaskQuery({ id: input.id }).query();

    if (!task) {
      throw createRpcError.notFound("任务不存在");
    }

    const agentCode = context.user?.agentCode;
    const checkin = agentCode
      ? await new GetNewbieTaskCheckinQuery({ agentCode, taskId: input.id }).query()
      : null;

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      categoryName: task.categoryName,
      pointAmount: task.pointAmount,
      pointEventId: task.pointEventId,
      displayOrder: task.displayOrder,
      stage: task.stage,
      stageTitle: task.stageTitle,
      isCheckedIn: Boolean(checkin),
      checkedInAt: checkin ? checkin.createdAt.toISOString() : null,
      evidenceFileIds: checkin?.evidenceFileIds ?? [],
    };
  },
});
