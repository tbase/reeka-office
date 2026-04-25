"use client"

import { UploadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldContent } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { importApmAction } from "./actions"

export function ImportApmDialog() {
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const form = formRef.current

    if (!form) {
      return
    }

    const formData = new FormData(form)

    startTransition(async () => {
      const result = await importApmAction(formData)
      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success(
        `导入完成：共 ${result.processedCount} 条，新增 ${result.createdCount} 条，更新 ${result.updatedCount} 条`,
      )
      form.reset()
      setSelectedFiles([])
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm" variant="outline">
            <UploadIcon className="size-4" />
            导入业绩
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>导入业绩数据</DialogTitle>
          <DialogDescription>
            选择一个或多个 PRU 业绩 CSV 文件后，系统会按表头解析并按代理人月份写入业绩数据。
          </DialogDescription>
        </DialogHeader>

        <form
          id="import-apm-form"
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
                multiple
                onChange={(event) => {
                  setSelectedFiles(
                    Array.from(event.target.files ?? []).map((file) => file.name),
                  )
                }}
                required
              />
            </FieldContent>
          </Field>

          {selectedFiles.length > 0 ? (
            <p className="text-muted-foreground text-sm">
              已选择 {selectedFiles.length} 个文件
              {selectedFiles.length === 1 ? `：${selectedFiles[0]}` : ""}
            </p>
          ) : null}
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
            form="import-apm-form"
            disabled={isPending || selectedFiles.length === 0}
          >
            {isPending ? "导入中..." : "确定"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
