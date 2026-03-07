import { createRpcError } from "@reeka-office/jsonrpc";
import { GetNewbieTaskQuery } from "@reeka-office/domain-newbie";
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
}

export const getTaskDetail = rpc.define({
  inputSchema,
  execute: async ({ input }): Promise<GetNewbieTaskDetailOutput> => {
    const task = await new GetNewbieTaskQuery({ id: input.id }).query();

    if (!task) {
      throw createRpcError.notFound("任务不存在");
    }

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
    };
  },
});
