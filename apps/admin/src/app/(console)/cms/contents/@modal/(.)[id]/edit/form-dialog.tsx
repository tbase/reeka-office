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
import { ContentFormEdit } from "@/components/cms/content-form-edit";
import { updateContentAction } from "../../../actions";

type ContentValue = {
  id: number;
  name: string;
  content: string;
  categoryId: number;
  fields: Record<string, unknown>;
};

export function ContentEditFormDialog({
  categories,
  value,
}: {
  categories: CategoryOption[];
  value: ContentValue;
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
      <DialogContent className="sm:max-w-2xl" showCloseButton>
        <DialogHeader>
          <DialogTitle>编辑内容</DialogTitle>
          <DialogDescription>
            请根据实际信息更新标题、正文与分类。
          </DialogDescription>
        </DialogHeader>
        <ContentFormEdit
          action={updateContentAction}
          categories={categories}
          id="content-form"
          value={value}
        />
        <DialogFooter>
          <Button type="submit" form="content-form">
            保存内容
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
