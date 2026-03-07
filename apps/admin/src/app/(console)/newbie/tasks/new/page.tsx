export const dynamic = "force-dynamic"

import {
  ListNewbieTaskCategoriesQuery,
  ListNewbieTaskStagesQuery,
} from "@reeka-office/domain-newbie"
import { ListPointItemsQuery } from "@reeka-office/domain-point"

import { NewbieTaskFormNew } from "@/components/newbie/newbie-task-form-new"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"

import { createNewbieTaskAction } from "../actions"

function parseStageId(value: string | undefined): number | undefined {
  const stageId = Number(value)
  if (!Number.isInteger(stageId) || stageId <= 0) {
    return undefined
  }

  return stageId
}

export default async function NewbieTaskCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ stageId?: string }>
}) {
  const { stageId: stageIdParam } = await searchParams
  const stageId = parseStageId(stageIdParam)

  const [stages, categories, pointItems] = await Promise.all([
    new ListNewbieTaskStagesQuery().query(),
    new ListNewbieTaskCategoriesQuery().query(),
    new ListPointItemsQuery().query(),
  ])

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增任务</h1>
        <p className="text-muted-foreground text-sm">创建后可在小程序新手任务中展示。</p>
      </div>

      <NewbieTaskFormNew
        action={createNewbieTaskAction}
        id="newbie-task-form"
        stages={stages}
        categories={categories}
        pointItems={pointItems}
        value={{ stageId }}
      />

      <div className="flex gap-2">
        <Button type="submit" form="newbie-task-form">
          创建任务
        </Button>
        <LinkButton href="/newbie/tasks" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
