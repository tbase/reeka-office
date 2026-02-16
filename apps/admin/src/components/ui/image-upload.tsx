"use client"

import { useId, useRef } from "react"
import Image from "next/image"
import { ImagePlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
        return
      }

      reject(new Error("读取图片失败"))
    }
    reader.onerror = () => {
      reject(reader.error ?? new Error("读取图片失败"))
    }
    reader.readAsDataURL(file)
  })
}

export function ImageUpload({
  id,
  value,
  alt,
  disabled,
  className,
  onChangeAction,
}: {
  id?: string
  value?: string
  alt?: string
  disabled?: boolean
  className?: string
  onChangeAction: (nextValue: string) => void
}) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const inputRef = useRef<HTMLInputElement>(null)
  const hasImage = Boolean(value?.trim())

  const openPicker = () => {
    if (disabled) {
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
        disabled={disabled}
        onChange={async (event) => {
          const file = event.target.files?.[0]
          if (!file) {
            return
          }

          try {
            const dataUrl = await readFileAsDataUrl(file)
            onChangeAction(dataUrl)
          } catch {
            onChangeAction("")
          }

          event.target.value = ""
        }}
      />

      <button
        type="button"
        onClick={openPicker}
        disabled={disabled}
        className="bg-muted/40 hover:bg-muted/60 relative aspect-square w-40 overflow-hidden rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      >
        {hasImage ? (
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
        <Button type="button" variant="ghost" size="sm" onClick={() => onChangeAction("")} disabled={disabled}>
          清除
        </Button>
      ) : null}
    </div>
  )
}
