export const dynamic = "force-dynamic"

import {
  ListNewbieTaskCategoriesQuery,
  ListNewbieTaskStagesQuery,
} from "@reeka-office/domain-newbie"
import { ListPointItemsQuery } from "@reeka-office/domain-point"

import { NewbieTaskFormDialog } from "./form-dialog"

function parseStageId(value: string | undefined): number | undefined {
  const stageId = Number(value)
  if (!Number.isInteger(stageId) || stageId <= 0) {
    return undefined
  }

  return stageId
}

export default async function NewbieTaskNewModal({
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
    <NewbieTaskFormDialog
      stages={stages}
      categories={categories}
      pointItems={pointItems}
      value={{ stageId }}
    />
  )
}
