"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PointItemFormEdit } from "@/components/points/point-item-form-edit"
import type { PointItemFormValue } from "@/components/points/point-item-form"

import { updatePointItemAction } from "../../../actions"

export function PointItemEditFormDialog({
  value,
}: {
  value: PointItemFormValue & { id: number }
}) {
  const router = useRouter()

  function handleClose() {
    router.back()
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>编辑积分事项</DialogTitle>
          <DialogDescription>
            修改后会影响后续积分发放规则。
          </DialogDescription>
        </DialogHeader>
        <PointItemFormEdit
          action={updatePointItemAction}
          id="point-item-form"
          value={value}
          onSuccess={() => router.back()}
        />
        <DialogFooter>
          <Button type="submit" form="point-item-form">
            保存事项
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
