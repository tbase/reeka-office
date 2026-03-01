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
import { PointItemFormNew } from "@/components/points/point-item-form-new"

import { createPointItemAction } from "../../actions"

export function PointItemNewFormDialog() {
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
          <DialogTitle>新增积分事项</DialogTitle>
          <DialogDescription>
            创建后可用于代理人积分发放。
          </DialogDescription>
        </DialogHeader>
        <PointItemFormNew action={createPointItemAction} id="point-item-form" />
        <DialogFooter>
          <Button type="submit" form="point-item-form">
            创建事项
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
