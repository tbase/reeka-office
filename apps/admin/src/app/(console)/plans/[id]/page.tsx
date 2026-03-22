export const dynamic = "force-dynamic";

import { GetPlanQuery } from "@reeka-office/domain-plan";
import { ListPointItemsQuery } from "@reeka-office/domain-point";
import { PlusIcon } from "lucide-react";

import {
  deletePlanStageAction,
} from "@/actions/plans/stage-actions";
import {
  archivePlanTaskAction,
} from "@/actions/plans/task-actions";
import {
  getPlanStatusText,
  getPlanStatusVariant,
} from "@/components/plans/status";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";
import { formatDateTime } from "@/lib/datetime";

function parseId(value: string) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效计划 ID");
  }

  return id;
}

export default async function PlanDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const planId = parseId(rawId);

  await getRequiredAdminContext();
  const [plan, pointItems] = await Promise.all([
    new GetPlanQuery({ id: planId }).query(),
    new ListPointItemsQuery().query(),
  ]);

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>计划不存在</CardTitle>
          <CardDescription>该计划可能已被删除。</CardDescription>
        </CardHeader>
        <CardContent>
          <LinkButton href="/plans" variant="outline" size="sm">
            返回计划列表
          </LinkButton>
        </CardContent>
      </Card>
    );
  }

  const canEdit = plan.status !== "archived";
  const pointItemMap = new Map(pointItems.map((item) => [item.id, item]));
  const taskCount = plan.stages.reduce(
    (count, stage) => count + stage.tasks.length,
    0,
  );
  const planEditHref = `/plans/${plan.id}/edit`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {plan.name}
            </h1>
            <Badge variant={getPlanStatusVariant(plan.status)}>
              {getPlanStatusText(plan.status)}
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm">
            更新于 {formatDateTime(plan.updatedAt)}，共 {plan.stages.length}{" "}
            个阶段 / {taskCount} 个任务。
          </p>
        </div>

        {canEdit ? (
          <LinkButton href={planEditHref} size="sm" variant="outline">
            编辑计划信息
          </LinkButton>
        ) : null}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1"></div>
          {canEdit ? (
            <LinkButton href={`/plans/${plan.id}/stages/new`} size="sm">
              <PlusIcon className="size-4" />
              新增阶段
            </LinkButton>
          ) : null}
        </div>

        {plan.stages.length === 0 ? (
          <Empty
            title="当前还没有阶段。"
            description="先新增阶段，再在阶段下维护任务。"
            action={
              canEdit ? (
                <LinkButton href={`/plans/${plan.id}/stages/new`} size="sm">
                  <PlusIcon className="size-4" />
                  新增阶段
                </LinkButton>
              ) : null
            }
          />
        ) : (
          <div className="space-y-3">
            {plan.stages.map((stage) => (
              <Card key={stage.id} size="sm">
                <CardHeader className="gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle>{stage.title}</CardTitle>
                      <p className="text-muted-foreground text-sm">
                        {stage.description || "暂无阶段说明"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {canEdit ? (
                        <LinkButton
                          href={`/plans/${plan.id}/tasks/new?stageId=${stage.id}`}
                          size="sm"
                          variant="outline"
                        >
                          新增任务
                        </LinkButton>
                      ) : null}

                      {canEdit ? (
                        <LinkButton
                          href={`/plans/${plan.id}/stages/${stage.id}/edit`}
                          size="sm"
                          variant="outline"
                        >
                          编辑阶段
                        </LinkButton>
                      ) : null}

                      {canEdit && stage.tasks.length === 0 ? (
                        <ConfirmAction
                          action={deletePlanStageAction}
                          hiddenFields={{ id: stage.id, planId: plan.id }}
                          title={`删除阶段「${stage.title}」？`}
                          description="此操作不可撤销。"
                          confirmLabel="确认删除"
                        >
                          <Button size="sm" variant="destructive">
                            删除阶段
                          </Button>
                        </ConfirmAction>
                      ) : null}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {stage.tasks.length === 0 ? (
                    <Empty title="该阶段下暂无任务。" />
                  ) : (
                    <div className="space-y-2">
                      {stage.tasks.map((task) => {
                        const pointItem = task.pointItemId
                          ? pointItemMap.get(task.pointItemId)
                          : null;
                        const canEditTask =
                          canEdit && task.status !== "archived";

                        return (
                          <div
                            key={task.id}
                            className="rounded-lg border px-3 py-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0 space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium">{task.title}</p>
                                  <Badge
                                    variant={
                                      task.status === "archived"
                                        ? "secondary"
                                        : "outline"
                                    }
                                  >
                                    {task.status === "archived"
                                      ? "已归档"
                                      : "进行中"}
                                  </Badge>
                                  <Badge variant="outline">
                                    {task.categoryName}
                                  </Badge>
                                  <Badge variant="outline">
                                    {task.taskType === "metric"
                                      ? "指标任务"
                                      : "普通任务"}
                                  </Badge>
                                  {task.isRequired ? (
                                    <Badge variant="default">必做</Badge>
                                  ) : (
                                    <Badge variant="secondary">选做</Badge>
                                  )}
                                </div>

                                <p className="text-muted-foreground text-sm">
                                  {task.description || "暂无任务说明"}
                                </p>

                                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                                  <span>排序 {task.displayOrder}</span>
                                  <span>
                                    奖励积分事项：
                                    {pointItem
                                      ? `${pointItem.category} / ${pointItem.name}`
                                      : task.pointItemId
                                        ? `#${task.pointItemId}`
                                        : "未设置"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {canEditTask ? (
                                  <LinkButton
                                    href={`/plans/${plan.id}/tasks/${task.id}/edit`}
                                    size="sm"
                                    variant="outline"
                                  >
                                    编辑
                                  </LinkButton>
                                ) : null}

                                {canEditTask ? (
                                  <ConfirmAction
                                    action={archivePlanTaskAction}
                                    hiddenFields={{
                                      id: task.id,
                                      planId: plan.id,
                                    }}
                                    title={`归档任务「${task.title}」？`}
                                    description="归档后任务仍可查看，但不再参与编辑和排序。"
                                    confirmLabel="确认归档"
                                    confirmVariant="secondary"
                                  >
                                    <Button size="sm" variant="secondary">
                                      归档任务
                                    </Button>
                                  </ConfirmAction>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
