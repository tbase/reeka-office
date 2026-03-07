export const dynamic = "force-dynamic";

import {
  ListNewbieTaskCategoriesQuery,
  ListNewbieTaskStagesQuery,
  ListNewbieTasksQuery,
  type NewbieTaskItem,
} from "@reeka-office/domain-newbie";
import { PencilIcon, PlusIcon } from "lucide-react";

import { NewbieTaskCategorySheet } from "@/components/newbie/newbie-task-category-sheet";
import { NewbieStageTaskList } from "@/components/newbie/newbie-stage-task-list";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LinkButton } from "@/components/ui/link-button";

import {
  createNewbieTaskCategoryAction,
  deleteNewbieTaskAction,
  deleteNewbieTaskCategoryAction,
  reorderNewbieTasksInStageAction,
  updateNewbieTaskCategoryAction,
} from "./actions";

function groupTasksByStageId(stageIds: number[], tasks: NewbieTaskItem[]): Map<number, NewbieTaskItem[]> {
  const tasksByStageId = new Map<number, NewbieTaskItem[]>();

  for (const stageId of stageIds) {
    tasksByStageId.set(stageId, []);
  }

  for (const task of tasks) {
    const stageTasks = tasksByStageId.get(task.stageId);
    if (stageTasks) {
      stageTasks.push(task);
      continue;
    }

    tasksByStageId.set(task.stageId, [task]);
  }

  return tasksByStageId;
}

export default async function NewbieTasksPage() {
  const [tasks, categories, stages] = await Promise.all([
    new ListNewbieTasksQuery().query(),
    new ListNewbieTaskCategoriesQuery().query(),
    new ListNewbieTaskStagesQuery().query(),
  ]);

  const tasksByStageId = groupTasksByStageId(
    stages.map((stage) => stage.id),
    tasks,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">任务管理</h1>
          <p className="text-muted-foreground text-sm">
            管理新手任务及其阶段、分类和积分配置。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton
            href="/newbie/stages/new?redirectTo=/newbie/tasks"
            size="sm"
          >
            <PlusIcon className="size-4" />
            新增阶段
          </LinkButton>
          <NewbieTaskCategorySheet
            categories={categories}
            createCategoryAction={createNewbieTaskCategoryAction}
            updateCategoryAction={updateNewbieTaskCategoryAction}
            deleteCategoryAction={deleteNewbieTaskCategoryAction}
          />
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-sm">
          暂无任务阶段，请先新增阶段。
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          <Accordion
            multiple
            defaultValue={stages.length > 0 ? [String(stages[0].id)] : []}
            className="rounded-lg border"
          >
            {stages.map((stage) => {
              const stageTasks = tasksByStageId.get(stage.id) ?? [];

              return (
                <AccordionItem
                  key={stage.id}
                  value={String(stage.id)}
                  className="px-3"
                >
                  <div className="flex items-center gap-2 py-1.5">
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="text-muted-foreground text-xs font-normal">
                        #{stage.stage}
                      </span>
                      <span className="truncate font-medium">
                        {stage.title}
                      </span>
                    </div>

                    <div className="ml-auto flex items-center gap-1">
                      <LinkButton
                        href={`/newbie/tasks/new?stageId=${stage.id}`}
                        size="icon-sm"
                        variant="ghost"
                        title="新增任务"
                        aria-label="新增任务"
                      >
                        <PlusIcon className="size-3.5" />
                      </LinkButton>

                      <LinkButton
                        href={`/newbie/stages/${stage.id}/edit?redirectTo=/newbie/tasks`}
                        size="icon-sm"
                        variant="ghost"
                        title="编辑阶段"
                        aria-label="编辑阶段"
                      >
                        <PencilIcon className="size-3.5" />
                      </LinkButton>

                      <AccordionTrigger
                        className="!flex-none !items-center !justify-center h-7 w-7 rounded-md py-0 hover:bg-muted hover:no-underline [&_[data-slot=accordion-trigger-icon]]:m-0"
                        title="展开/折叠"
                        aria-label={`展开或折叠阶段 ${stage.title}`}
                      />
                    </div>
                  </div>

                  <AccordionContent>
                    {stageTasks.length === 0 ? (
                      <div className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-sm">
                        当前阶段暂无任务。
                      </div>
                    ) : (
                      <NewbieStageTaskList
                        stageId={stage.id}
                        tasks={stageTasks}
                        deleteTaskAction={deleteNewbieTaskAction}
                        reorderTasksAction={reorderNewbieTasksInStageAction}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      )}
    </div>
  );
}
