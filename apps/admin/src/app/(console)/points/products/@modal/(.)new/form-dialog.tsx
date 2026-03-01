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
import { ProductFormNew } from "@/components/points/product-form-new"

import { createProductAction } from "../../actions"

export function ProductNewFormDialog() {
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
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>新增兑换商品</DialogTitle>
          <DialogDescription>
            新建后默认为草稿，可发布后提供给代理人兑换。
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <ProductFormNew action={createProductAction} id="product-form" />
        </div>
        <DialogFooter className="pt-2">
          <Button type="submit" form="product-form">
            创建商品
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
