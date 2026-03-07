"use client"

import type { NewbieTaskCategoryRow, NewbieTaskStageRow } from "@reeka-office/domain-newbie"
import type { PointItemRow } from "@reeka-office/domain-point"
import { useRouter } from "next/navigation"

import {
  NewbieTaskFormEdit,
} from "@/components/newbie/newbie-task-form-edit"
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

import { updateNewbieTaskAction } from "../../../actions"

export function NewbieTaskEditFormDialog({
  value,
  stages,
  categories,
  pointItems,
}: {
  value: NewbieTaskFormValue & { id: number }
  stages: NewbieTaskStageRow[]
  categories: NewbieTaskCategoryRow[]
  pointItems: PointItemRow[]
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
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>编辑任务</DialogTitle>
          <DialogDescription>修改后会影响新手任务展示与积分配置。</DialogDescription>
        </DialogHeader>

        <NewbieTaskFormEdit
          action={updateNewbieTaskAction}
          id="newbie-task-form"
          value={value}
          stages={stages}
          categories={categories}
          pointItems={pointItems}
          onSuccess={() => router.back()}
        />

        <DialogFooter>
          <Button type="submit" form="newbie-task-form">
            保存任务
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
