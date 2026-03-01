"use client";

import { useRouter } from "next/navigation";

import { Expand } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { CategoryFormNew } from "@/components/cms/category-form-new";

import { createCategoryAction } from "../../actions";

export function CategoryFormDialog() {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton={false}>
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <DialogTitle>新增分类</DialogTitle>
              <DialogDescription>
                创建分类并设置需要录入的信息项。
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              render={
                <a href="/cms/categories/new">
                  <Expand className="h-3.5 w-3.5" />
                </a>
              }
            />
          </div>
        </DialogHeader>
        <CategoryFormNew action={createCategoryAction} id="category-form" />
        <DialogFooter>
          <Button type="submit" form="category-form">
            创建分类
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
