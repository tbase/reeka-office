import { type ReactNode, useEffect } from "react"
import { createPortal } from "react-dom"

import { cn } from "@/lib/utils"

function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) {
      return
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onOpenChange(false)
      }
    }

    document.addEventListener("keydown", onKeyDown)
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = originalOverflow
    }
  }, [onOpenChange, open])

  if (!open) {
    return null
  }

  return createPortal(children, document.body)
}

function DialogContent({
  className,
  onClose,
  children,
}: {
  className?: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-lg border border-white/60 bg-white/95 shadow-2xl",
          className,
        )}
      >
        {children}
      </div>
    </div>
  )
}

function DialogHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("space-y-1 px-6 pt-6", className)}>{children}</div>
}

function DialogTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h2 className={cn("text-lg font-semibold tracking-tight", className)}>{children}</h2>
}

function DialogDescription({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return <p className={cn("text-sm text-muted-foreground", className)}>{children}</p>
}

function DialogBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("px-6 py-5", className)}>{children}</div>
}

function DialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("flex items-center justify-end gap-2 border-t border-border/70 px-6 py-4", className)}>
      {children}
    </div>
  )
}

export { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle }
