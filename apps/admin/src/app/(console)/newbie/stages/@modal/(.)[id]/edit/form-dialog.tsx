"use client"

import { useRouter } from "next/navigation"

import {
  NewbieStageFormEdit,
} from "@/components/newbie/newbie-stage-form-edit"
import type { NewbieStageFormValue } from "@/components/newbie/newbie-stage-form"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { updateNewbieStageAction } from "../../../actions"

export function NewbieStageEditFormDialog({
  value,
}: {
  value: NewbieStageFormValue & { id: number }
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
          <DialogTitle>编辑任务阶段</DialogTitle>
          <DialogDescription>
            修改后会影响新手任务在前台的阶段展示。
          </DialogDescription>
        </DialogHeader>

        <NewbieStageFormEdit
          action={updateNewbieStageAction}
          id="newbie-stage-form"
          value={value}
          onSuccess={() => router.back()}
        />

        <DialogFooter>
          <Button type="submit" form="newbie-stage-form">
            保存阶段
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
