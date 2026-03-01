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

import type { CategoryOption } from "@/components/cms/content-fields";
import { ContentFormNew } from "@/components/cms/content-form-new";
import { createContentAction } from "../../actions";

export function ContentFormDialog({
  categories,
  defaultCategoryId,
}: {
  categories: CategoryOption[];
  defaultCategoryId?: number;
}) {
  const router = useRouter();

  function handleClose() {
    router.back();
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增内容</DialogTitle>
          <DialogDescription>
            请选择分类并填写标题、正文与扩展信息。
          </DialogDescription>
        </DialogHeader>
        <ContentFormNew
          action={createContentAction}
          categories={categories}
          id="content-form"
          categoryId={defaultCategoryId}
        />
        <DialogFooter>
          <Button
            type="submit"
            form="content-form"
            disabled={categories.length === 0}
          >
            创建内容
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
