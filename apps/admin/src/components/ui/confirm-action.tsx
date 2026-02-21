"use client"

import { useRef } from "react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { buttonVariants } from "@/components/ui/button"
import type { VariantProps } from "class-variance-authority"
import type { ReactElement } from "react"

export function ConfirmAction({
  children,
  action,
  hiddenFields = {},
  title,
  description,
  confirmLabel = "确认",
  confirmVariant = "destructive",
}: {
  children: ReactElement
  action: (formData: FormData) => void | Promise<void>
  hiddenFields?: Record<string, unknown>
  title: string
  description?: string
  confirmLabel?: string
  confirmVariant?: VariantProps<typeof buttonVariants>["variant"]
}) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <AlertDialog>
      <AlertDialogTrigger render={children} />
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>取消</AlertDialogCancel>
          <form ref={formRef} action={action} className="contents">
            {Object.entries(hiddenFields).map(([name, value]) => (
              <input key={name} type="hidden" name={name} value={String(value)} />
            ))}
            <AlertDialogAction type="submit" variant={confirmVariant}>
              {confirmLabel}
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
