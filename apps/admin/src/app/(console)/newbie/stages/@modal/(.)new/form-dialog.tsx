"use client"

import { useRouter } from "next/navigation"

import { NewbieStageFormNew } from "@/components/newbie/newbie-stage-form-new"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { createNewbieStageAction } from "../../actions"

export function NewbieStageFormDialog({
  redirectTo,
}: {
  redirectTo?: string
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
          <DialogTitle>新增任务阶段</DialogTitle>
          <DialogDescription>
            创建后可在任务管理中按阶段归类使用。
          </DialogDescription>
        </DialogHeader>

        <NewbieStageFormNew
          action={createNewbieStageAction}
          id="newbie-stage-form"
          redirectTo={redirectTo}
        />

        <DialogFooter>
          <Button type="submit" form="newbie-stage-form">
            创建阶段
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
