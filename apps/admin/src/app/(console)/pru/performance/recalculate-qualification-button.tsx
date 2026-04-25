"use client"

import { getDesignationName } from "@reeka-office/domain-agent"
import { RefreshCcwIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

import { recalculateApmQualificationAction } from "./actions"
import {
  formatMoney,
  formatPeriod,
} from "./format"

type RecalculateApmQualificationSuccess = Extract<
  Awaited<ReturnType<typeof recalculateApmQualificationAction>>,
  { success: true }
>

type GapChange = RecalculateApmQualificationSuccess["gapChanges"][number]

const gapFieldLabels: Record<GapChange["field"], string> = {
  qualifiedGap: "当月合资格差距",
  qualifiedGapNextMonth: "下月合资格差距",
}

function formatMonth(value: string | null) {
  return value ? value.slice(0, 7) : "-"
}

function getGapStatus(value: number | null) {
  if (value == null) {
    return {
      label: "未知",
      className: "text-muted-foreground",
    }
  }

  if (value >= 0) {
    return {
      label: "合资格",
      className: "text-success",
    }
  }

  return {
    label: "未合资格",
    className: "text-destructive",
  }
}

function GapValue({ value }: { value: number | null }) {
  return (
    <span
      className={cn(
        "tabular-nums",
        value != null && (value < 0 ? "text-destructive" : "text-success"),
      )}
    >
      {value == null ? "-" : formatMoney(value)}
    </span>
  )
}

function QualificationStatus({ value }: { value: number | null }) {
  const status = getGapStatus(value)

  return (
    <span className={cn("whitespace-nowrap", status.className)}>
      {status.label}
    </span>
  )
}

export function RecalculateQualificationButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [lastResult, setLastResult] = useState<RecalculateApmQualificationSuccess | null>(null)

  const handleClick = () => {
    startTransition(async () => {
      const result = await recalculateApmQualificationAction()
      if ("error" in result) {
        toast.error(result.error)
        return
      }

      setLastResult(result)
      toast.success(
        `重算完成：处理 ${result.agentCount} 人，更新 ${result.updatedCount} 条，跳过 ${result.skippedCount} 人`,
      )
      setDetailsOpen(result.gapChanges.length > 0)
      router.refresh()
    })
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleClick}
        disabled={isPending}
      >
        <RefreshCcwIcon className="size-4" />
        {isPending ? "重算中..." : "重算合资格"}
      </Button>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {lastResult
                ? `合资格 gap 变更：处理 ${lastResult.agentCount} 人，更新 ${lastResult.updatedCount} 条，跳过 ${lastResult.skippedCount} 人`
                : "合资格 gap 变更"}
            </DialogTitle>
            {lastResult ? (
              <DialogDescription>
                共 {lastResult.gapChanges.length} 条 gap 变更，当前计算月份为{" "}
                {formatPeriod(lastResult.currentPeriod.year, lastResult.currentPeriod.month)}
                ，下月计算月份为{" "}
                {formatPeriod(lastResult.nextPeriod.year, lastResult.nextPeriod.month)}。
              </DialogDescription>
            ) : null}
          </DialogHeader>

          {lastResult ? (
            <div className="overflow-hidden rounded-md border">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full min-w-[960px] text-sm">
                  <thead className="sticky top-0 z-10 bg-background">
                    <tr className="border-b text-xs text-muted-foreground">
                      <th className="px-3 py-2 text-left font-medium">代理人</th>
                      <th className="px-3 py-2 text-left font-medium">职级</th>
                      <th className="px-3 py-2 text-left font-medium">入职月份</th>
                      <th className="px-3 py-2 text-left font-medium">上次晋升</th>
                      <th className="px-3 py-2 text-left font-medium">月份</th>
                      <th className="px-3 py-2 text-left font-medium">变更项</th>
                      <th className="px-3 py-2 text-right font-medium">变更前</th>
                      <th className="px-3 py-2 text-right font-medium">变更后</th>
                      <th className="px-3 py-2 text-left font-medium">状态变化</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lastResult.gapChanges.map((change) => (
                      <tr
                        key={[
                          change.agentCode,
                          change.period.year,
                          change.period.month,
                          change.field,
                        ].join(":")}
                        className="border-b text-xs last:border-b-0"
                      >
                        <td className="px-3 py-2 align-middle">
                          <div className="font-medium text-foreground">
                            {change.agentName || "-"}
                          </div>
                          <div className="font-mono text-muted-foreground">
                            {change.agentCode}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-middle">
                          {getDesignationName(change.designation) ?? "-"}
                        </td>
                        <td className="px-3 py-2 align-middle tabular-nums">
                          {formatMonth(change.joinDate)}
                        </td>
                        <td className="px-3 py-2 align-middle tabular-nums">
                          {formatMonth(change.lastPromotionDate)}
                        </td>
                        <td className="px-3 py-2 align-middle tabular-nums">
                          {formatPeriod(change.period.year, change.period.month)}
                        </td>
                        <td className="px-3 py-2 align-middle">
                          {gapFieldLabels[change.field]}
                        </td>
                        <td className="px-3 py-2 text-right align-middle">
                          <GapValue value={change.before} />
                        </td>
                        <td className="px-3 py-2 text-right align-middle">
                          <GapValue value={change.after} />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <div className="flex items-center gap-1.5">
                            <QualificationStatus value={change.before} />
                            <span className="text-muted-foreground">→</span>
                            <QualificationStatus value={change.after} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
