import { ListNewbieTaskCheckinsQuery, ListNewbieTasksQuery, ListNewbieTaskStagesQuery } from "@reeka-office/domain-newbie";
import { z } from "zod";

import { rpc } from "../../context";

const inputSchema = z.void();

export type GetNewbieHomeInput = z.infer<typeof inputSchema>;
export interface GetNewbieHomeOutput {
  stages: Array<{
    id: number;
    stage: string;
    title: string;
    description: string | null;
    tasks: Array<{
      id: number;
      title: string;
      description: string | null;
      categoryName: string;
      pointAmount: number | null;
      pointEventId: number;
      displayOrder: number;
      isCheckedIn: boolean;
    }>;
  }>;
}

export const getHome = rpc.define({
  inputSchema,
  execute: async ({ context }): Promise<GetNewbieHomeOutput> => {
    const agentCode = context.user?.agentCode;

    const [stages, tasks, checkins] = await Promise.all([
      new ListNewbieTaskStagesQuery().query(),
      new ListNewbieTasksQuery().query(),
      agentCode ? new ListNewbieTaskCheckinsQuery({ agentCode }).query() : Promise.resolve([]),
    ]);

    const tasksByStageId = new Map<number, GetNewbieHomeOutput["stages"][number]["tasks"]>();
    const checkedTaskIds = new Set(checkins.map((item) => item.taskId));

    for (const task of tasks) {
      const stageTasks = tasksByStageId.get(task.stageId) ?? [];
      stageTasks.push({
        id: task.id,
        title: task.title,
        description: task.description,
        categoryName: task.categoryName,
        pointAmount: task.pointAmount,
        pointEventId: task.pointEventId,
        displayOrder: task.displayOrder,
        isCheckedIn: checkedTaskIds.has(task.id),
      });
      tasksByStageId.set(task.stageId, stageTasks);
    }

    return {
      stages: stages.map((stage) => ({
        id: stage.id,
        stage: stage.stage,
        title: stage.title,
        description: stage.description,
        tasks: tasksByStageId.get(stage.id) ?? [],
      })),
    };
  },
});
