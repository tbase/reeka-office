"use client";

import { UploadIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldContent } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { importAgentsAction } from "./actions";

export function ImportAgentsDialog() {
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const form = formRef.current;

    if (!form) {
      return;
    }

    const formData = new FormData(form);

    startTransition(async () => {
      const result = await importAgentsAction(formData);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `导入完成：共 ${result.importedCount} 人，新增 ${result.createdCount} 人，更新 ${result.updatedCount} 人，软删除 ${result.deletedCount} 人`,
      );
      form.reset();
      setSelectedFileName("");
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <UploadIcon className="size-4" />
            导入代理人
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>导入代理人</DialogTitle>
          <DialogDescription>
            选择 CSV 文件后，系统会按表头解析代理人数据并同步到当前租户。
          </DialogDescription>
        </DialogHeader>

        <form
          id="import-agents-form"
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <Field>
            <FieldContent>
              <Input
                id="file"
                name="file"
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => {
                  setSelectedFileName(event.target.files?.[0]?.name ?? "");
                }}
                required
              />
            </FieldContent>
          </Field>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            取消
          </Button>
          <Button
            type="submit"
            form="import-agents-form"
            disabled={isPending || !selectedFileName}
          >
            {isPending ? "导入中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
