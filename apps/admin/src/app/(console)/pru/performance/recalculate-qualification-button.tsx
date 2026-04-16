"use client"

import { RefreshCcwIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { recalculateApmQualificationAction } from "./actions"

export function RecalculateQualificationButton() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleClick = async () => {
    setIsSubmitting(true)

    try {
      const result = await recalculateApmQualificationAction()
      if ("error" in result) {
        toast.error(result.error)
        return
      }

      toast.success(
        `重算完成：处理 ${result.agentCount} 人，更新 ${result.updatedCount} 条，跳过 ${result.skippedCount} 人`,
      )
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={handleClick}
      disabled={isSubmitting}
    >
      <RefreshCcwIcon className="size-4" />
      {isSubmitting ? "重算中..." : "重算合资格"}
    </Button>
  )
}
