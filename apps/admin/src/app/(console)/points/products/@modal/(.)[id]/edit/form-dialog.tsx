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
import { ProductFormEdit } from "@/components/points/product-form-edit"
import type { ProductFormValue } from "@/components/points/product-form"

import { updateProductAction } from "@/actions/points/product-actions"

export function ProductEditFormDialog({
  value,
}: {
  value: ProductFormValue
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
      <DialogContent className="flex max-h-[90vh] flex-col sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>编辑兑换商品</DialogTitle>
          <DialogDescription>
            草稿状态可编辑；发布后仅可下架。
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          <ProductFormEdit
            action={updateProductAction}
            id="product-form"
            value={value}
            onSuccess={() => router.back()}
          />
        </div>
        <DialogFooter className="pt-2">
          <Button type="submit" form="product-form">
            保存商品
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
