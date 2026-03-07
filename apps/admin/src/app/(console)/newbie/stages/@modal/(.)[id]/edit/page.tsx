import { GetNewbieTaskStageQuery } from "@reeka-office/domain-newbie"
import { notFound } from "next/navigation"

import { NewbieStageEditFormDialog } from "./form-dialog"

function parseId(value: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效阶段 ID")
  }
  return id
}

export default async function NewbieStageEditModal({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idParam } = await params
  const id = parseId(idParam)

  const stage = await new GetNewbieTaskStageQuery({ id }).query()
  if (!stage) {
    notFound()
  }

  return (
    <NewbieStageEditFormDialog
      value={{
        id: stage.id,
        stage: stage.stage,
        title: stage.title,
        description: stage.description,
      }}
    />
  )
}
