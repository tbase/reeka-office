"use client";

import type { NewbieTaskCategoryRow } from "@reeka-office/domain-newbie";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type CategoryAction = (formData: FormData) => Promise<{ success: true } | void>;

export function NewbieTaskCategorySheet({
  categories,
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
}: {
  categories: NewbieTaskCategoryRow[];
  createCategoryAction: CategoryAction;
  updateCategoryAction: CategoryAction;
  deleteCategoryAction: CategoryAction;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isPending, startTransition] = useTransition();

  const runAction = (
    action: () => Promise<void>,
    successMessage: string,
    onSuccess?: () => void,
  ) => {
    startTransition(async () => {
      try {
        await action();
        toast.success(successMessage);
        onSuccess?.();
        router.refresh();
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "操作失败，请稍后重试",
        );
      }
    });
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = newName.trim();
    if (!name) {
      toast.error("任务分类不能为空");
      return;
    }

    runAction(
      async () => {
        const formData = new FormData();
        formData.set("name", name);
        await createCategoryAction(formData);
      },
      "分类已创建",
      () => setNewName(""),
    );
  };

  const handleUpdate = () => {
    if (!editingId) {
      return;
    }

    const name = editingName.trim();
    if (!name) {
      toast.error("任务分类不能为空");
      return;
    }

    runAction(
      async () => {
        const formData = new FormData();
        formData.set("id", String(editingId));
        formData.set("name", name);
        await updateCategoryAction(formData);
      },
      "分类已更新",
      () => {
        setEditingId(null);
        setEditingName("");
      },
    );
  };

  const handleDelete = (category: NewbieTaskCategoryRow) => {
    const confirmed = window.confirm(`确认删除分类「${category.name}」？`);
    if (!confirmed) {
      return;
    }

    runAction(
      async () => {
        const formData = new FormData();
        formData.set("id", String(category.id));
        await deleteCategoryAction(formData);
      },
      "分类已删除",
      () => {
        if (editingId === category.id) {
          setEditingId(null);
          setEditingName("");
        }
      },
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        分类管理
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>任务分类管理</SheetTitle>
          <SheetDescription>支持创建、编辑和删除任务分类。</SheetDescription>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <form className="flex gap-2" onSubmit={handleCreate}>
            <Input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="输入新分类名称"
              disabled={isPending}
            />
            <Button type="submit" size="sm" disabled={isPending}>
              <PlusIcon className="size-4" />
              新增
            </Button>
          </form>

          {categories.length === 0 ? (
            <div className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-sm">
              暂无分类，请先新增一个分类。
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => {
                const isEditing = editingId === category.id;
                return (
                  <div
                    key={category.id}
                    className="flex items-center gap-2 rounded-md border p-2"
                  >
                    {isEditing ? (
                      <Input
                        value={editingName}
                        onChange={(event) => setEditingName(event.target.value)}
                        disabled={isPending}
                      />
                    ) : (
                      <span className="flex-1 truncate text-sm font-medium">
                        {category.name}
                      </span>
                    )}

                    {isEditing ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleUpdate}
                          disabled={isPending}
                        >
                          保存
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                          disabled={isPending}
                        >
                          取消
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingId(category.id);
                            setEditingName(category.name);
                          }}
                          disabled={isPending}
                        >
                          <PencilIcon className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon-sm"
                          onClick={() => handleDelete(category)}
                          disabled={isPending}
                        >
                          <Trash2Icon className="size-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
