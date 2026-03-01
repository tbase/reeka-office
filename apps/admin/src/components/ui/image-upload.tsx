"use client"

import { useId, useRef, useState } from "react"
import Image from "next/image"
import { ImagePlusIcon, Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData()
  formData.append("file", file)

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  })

  const data = await res.json() as { url?: string; error?: string }

  if (!res.ok) {
    throw new Error(data.error ?? "上传失败")
  }

  if (!data.url) {
    throw new Error("服务器未返回文件地址")
  }

  return data.url
}

export function ImageUpload({
  id,
  value,
  alt,
  disabled,
  className,
  onChangeAction,
  onError,
}: {
  id?: string
  value?: string
  alt?: string
  disabled?: boolean
  className?: string
  onChangeAction: (nextValue: string) => void
  onError?: (err: Error) => void
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const hasImage = Boolean(value?.trim())

  const openPicker = () => {
    if (disabled || uploading) {
      return
    }

    inputRef.current?.click()
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) {
            return
          }

          setUploading(true)
          try {
            const url = await uploadFile(file)
            onChangeAction(url)
          } catch (err) {
            const error = err instanceof Error ? err : new Error("上传失败")
            onError?.(error)
          } finally {
            setUploading(false)
          }

          event.target.value = ""
        }}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={disabled || uploading}
        className="bg-muted/40 hover:bg-muted/60 relative aspect-square w-40 overflow-hidden rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {uploading ? (
          <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1 text-xs">
            <Loader2Icon className="size-4 animate-spin" />
            上传中…
          </div>
        ) : hasImage ? (
          <Image
            src={value ?? ""}
            alt={alt ?? "上传图片"}
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full flex-col items-center justify-center gap-1 text-xs">
            <ImagePlusIcon className="size-4" />
            上传图片
          </div>
        )}
      </button>

      {hasImage ? (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChangeAction("")} disabled={disabled || uploading}>
          清除
        </Button>
      ) : null}
    </div>
  )
}
