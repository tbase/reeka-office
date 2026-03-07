"use client"

import type { NewbieTaskCategoryRow, NewbieTaskStageRow } from "@reeka-office/domain-newbie"
import type { PointItemRow } from "@reeka-office/domain-point"
import { useRouter } from "next/navigation"

import { NewbieTaskFormNew } from "@/components/newbie/newbie-task-form-new"
import type { NewbieTaskFormValue } from "@/components/newbie/newbie-task-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { createNewbieTaskAction } from "../../actions"

export function NewbieTaskFormDialog({
  stages,
  categories,
  pointItems,
  value,
}: {
  stages: NewbieTaskStageRow[]
  categories: NewbieTaskCategoryRow[]
  pointItems: PointItemRow[]
  value?: NewbieTaskFormValue
}) {
  const router = useRouter()

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          router.back()
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增任务</DialogTitle>
          <DialogDescription>创建后可在小程序新手任务中展示。</DialogDescription>
        </DialogHeader>

        <NewbieTaskFormNew
          action={createNewbieTaskAction}
          id="newbie-task-form"
          stages={stages}
          categories={categories}
          pointItems={pointItems}
          value={value}
        />

        <DialogFooter>
          <Button type="submit" form="newbie-task-form">
            创建任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
