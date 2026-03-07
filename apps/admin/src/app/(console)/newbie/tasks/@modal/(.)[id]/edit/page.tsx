export const dynamic = "force-dynamic"

import {
  GetNewbieTaskQuery,
  ListNewbieTaskCategoriesQuery,
  ListNewbieTaskStagesQuery,
} from "@reeka-office/domain-newbie"
import { ListPointItemsQuery } from "@reeka-office/domain-point"
import { notFound } from "next/navigation"

import { NewbieTaskEditFormDialog } from "./form-dialog"

function parseId(value: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效任务 ID")
  }
  return id
}

export default async function NewbieTaskEditModal({
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
    <NewbieTaskEditFormDialog
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
  )
}
