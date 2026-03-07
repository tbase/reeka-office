export const dynamic = "force-dynamic"

import {
  GetNewbieTaskQuery,
  ListNewbieTaskCategoriesQuery,
  ListNewbieTaskStagesQuery,
} from "@reeka-office/domain-newbie"
import { ListPointItemsQuery } from "@reeka-office/domain-point"
import { notFound } from "next/navigation"

import { NewbieTaskFormEdit } from "@/components/newbie/newbie-task-form-edit"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"

import { updateNewbieTaskAction } from "../../actions"

function parseId(value: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效任务 ID")
  }
  return id
}

export default async function NewbieTaskEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idParam } = await params
  const id = parseId(idParam)

  const [task, stages, categories, pointItems] = await Promise.all([
    new GetNewbieTaskQuery({ id }).query(),
    new ListNewbieTaskStagesQuery().query(),
    new ListNewbieTaskCategoriesQuery().query(),
    new ListPointItemsQuery().query(),
  ])

  if (!task) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">编辑任务：{task.title}</h1>
        <p className="text-muted-foreground text-sm">修改后会影响新手任务展示与积分配置。</p>
      </div>

      <NewbieTaskFormEdit
        action={updateNewbieTaskAction}
        id="newbie-task-form"
        stages={stages}
        categories={categories}
        pointItems={pointItems}
        value={{
          id: task.id,
          title: task.title,
          description: task.description,
          stageId: task.stageId,
          categoryName: task.categoryName,
          displayOrder: task.displayOrder,
          pointEventId: task.pointEventId,
          pointAmount: task.pointAmount,
        }}
      />

      <div className="flex gap-2">
        <Button type="submit" form="newbie-task-form">
          保存任务
        </Button>
        <LinkButton href="/newbie/tasks" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
