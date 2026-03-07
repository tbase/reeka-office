"use client";

import type { NewbieTaskItem } from "@reeka-office/domain-newbie";
import { GripVerticalIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { type DragEvent, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { LinkButton } from "@/components/ui/link-button";
import { cn } from "@/lib/utils";

type ReorderTaskAction = (formData: FormData) => Promise<{ success: true } | void>;
type DeleteTaskAction = (formData: FormData) => Promise<void>;

interface NewbieStageTaskListProps {
  stageId: number;
  tasks: NewbieTaskItem[];
  deleteTaskAction: DeleteTaskAction;
  reorderTasksAction: ReorderTaskAction;
}

function reorderTasks(tasks: NewbieTaskItem[], fromId: number, toId: number): NewbieTaskItem[] {
  const fromIndex = tasks.findIndex((task) => task.id === fromId);
  const toIndex = tasks.findIndex((task) => task.id === toId);
  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return tasks;
  }

  const next = [...tasks];
  const [moved] = next.splice(fromIndex, 1);
  if (!moved) {
    return tasks;
  }

  next.splice(toIndex, 0, moved);
  return next;
}

function createTaskOrderKey(tasks: NewbieTaskItem[]): string {
  return tasks.map((task) => task.id).join(",");
}

function createReorderFormData(stageId: number, tasks: NewbieTaskItem[]): FormData {
  const formData = new FormData();
  formData.set("stageId", String(stageId));
  formData.set(
    "orderedTaskIds",
    JSON.stringify(tasks.map((task) => task.id)),
  );

  return formData;
}

function parseDraggedTaskId(event: DragEvent<HTMLButtonElement>): number | null {
  const sourceId = Number(event.dataTransfer.getData("text/plain"));
  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    return null;
  }

  return sourceId;
}

export function NewbieStageTaskList({
  stageId,
  tasks,
  deleteTaskAction,
  reorderTasksAction,
}: NewbieStageTaskListProps) {
  const router = useRouter();
  const [localTasks, setLocalTasks] = useState(tasks);
  const [draggingTaskId, setDraggingTaskId] = useState<number | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  function resetDragState(): void {
    setDraggingTaskId(null);
    setDragOverTaskId(null);
  }

  const currentOrderKey = createTaskOrderKey(localTasks);

  function saveOrder(nextTasks: NewbieTaskItem[]): void {
    const nextOrderKey = createTaskOrderKey(nextTasks);
    if (nextOrderKey === currentOrderKey) {
      return;
    }

    startTransition(async () => {
      try {
        await reorderTasksAction(createReorderFormData(stageId, nextTasks));
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "保存排序失败，请稍后重试",
        );
        setLocalTasks(tasks);
        resetDragState();
      }
    });
  }

  function handleDrop(targetTaskId: number, event: DragEvent<HTMLButtonElement>): void {
    event.preventDefault();

    const sourceId = parseDraggedTaskId(event);
    if (sourceId === null || sourceId === targetTaskId) {
      resetDragState();
      return;
    }

    const nextTasks = reorderTasks(localTasks, sourceId, targetTaskId);
    setLocalTasks(nextTasks);
    resetDragState();
    saveOrder(nextTasks);
  }

  return (
    <div className="pb-1">
      {localTasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            "border-b py-3 text-sm transition-colors last:border-b-0",
            draggingTaskId === task.id && "opacity-50",
            dragOverTaskId === task.id && "bg-muted/50",
          )}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  draggable={!isPending}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", String(task.id));
                    setDraggingTaskId(task.id);
                  }}
                  onDragEnd={resetDragState}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (dragOverTaskId !== task.id) {
                      setDragOverTaskId(task.id);
                    }
                  }}
                  onDrop={(event) => {
                    handleDrop(task.id, event);
                  }}
                  className="text-muted-foreground rounded p-0.5 hover:bg-muted cursor-grab active:cursor-grabbing"
                  aria-label={`拖动排序任务 ${task.title}`}
                  disabled={isPending}
                >
                  <GripVerticalIcon className="size-4" />
                </button>
                <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  {task.categoryName}
                </span>
                <p className="font-medium leading-none">{task.title}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LinkButton
                className="!no-underline"
                href={`/newbie/tasks/${task.id}/edit`}
                variant="outline"
                size="sm"
              >
                编辑
              </LinkButton>
              <ConfirmAction
                action={async (formData) => {
                  await deleteTaskAction(formData);
                }}
                hiddenFields={{ id: String(task.id) }}
                title={`删除「${task.title}」？`}
                description="此操作不可撤销。删除后该任务将不再展示。"
                confirmLabel="确认删除"
              >
                <Button variant="destructive" size="sm">
                  删除
                </Button>
              </ConfirmAction>
            </div>
          </div>
        </div>
      ))}

      {isPending ? (
        <div className="text-muted-foreground pt-2 text-xs">正在保存排序...</div>
      ) : null}
    </div>
  );
}
