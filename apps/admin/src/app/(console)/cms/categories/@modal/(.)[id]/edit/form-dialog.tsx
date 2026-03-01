"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  CategoryFormEdit,
  type CategoryFormEditValue,
} from "@/components/cms/category-form-edit";

import { updateCategoryAction } from "../../../actions";

export function CategoryEditFormDialog({
  category,
}: {
  category: CategoryFormEditValue;
}) {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle>编辑分类</DialogTitle>
          <DialogDescription>
            修改后将应用到该分类下后续内容录入。
          </DialogDescription>
        </DialogHeader>
        <CategoryFormEdit
          action={updateCategoryAction}
          id="category-form"
          value={category}
          onSuccess={() => router.back()}
        />
        <DialogFooter>
          <Button type="submit" form="category-form">
            保存分类
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
