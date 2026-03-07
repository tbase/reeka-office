export const dynamic = "force-dynamic";

import { ListNewbieTaskStagesQuery } from "@reeka-office/domain-newbie";
import { PlusIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { LinkButton } from "@/components/ui/link-button";

import { deleteNewbieStageAction } from "./actions";

export default async function NewbieStagesPage() {
  const stages = await new ListNewbieTaskStagesQuery().query();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">阶段管理</h1>
          <p className="text-muted-foreground text-sm">
            配置新手任务的阶段定义，用于后续任务归类。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">共 {stages.length} 条</Badge>
          <LinkButton href="/newbie/stages/new" size="sm">
            <PlusIcon className="size-4" />
            新增阶段
          </LinkButton>
        </div>
      </div>

      {stages.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-sm">
          暂无任务阶段。
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {stages.map((stage) => (
            <Card key={stage.id}>
              <CardHeader className="gap-2">
                <CardTitle className="text-base leading-none flex items-center gap-2">
                  <span className="text-muted-foreground text-xs font-normal">
                    #{stage.stage}
                  </span>
                  {stage.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="flex justify-end gap-2">
                  <LinkButton
                    href={`/newbie/stages/${stage.id}/edit`}
                    variant="outline"
                    size="sm"
                  >
                    编辑
                  </LinkButton>
                  <ConfirmAction
                    action={deleteNewbieStageAction}
                    hiddenFields={{ id: String(stage.id) }}
                    title={`删除「${stage.title}」？`}
                    description="此操作不可撤销。删除后关联到该阶段的任务将受影响。"
                    confirmLabel="确认删除"
                  >
                    <Button variant="destructive" size="sm">
                      删除
                    </Button>
                  </ConfirmAction>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
