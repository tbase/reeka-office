"use client"

import { useFormStatus } from "react-dom"

import { Loader2Icon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function SubmitButton({ children, disabled, ...props }: React.ComponentProps<typeof Button>) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" disabled={pending || disabled} {...props}>
      {pending && <Loader2Icon className="animate-spin" />}
      {children}
    </Button>
  )
}
