"use client"

import { CalendarIcon } from "lucide-react"

import type { Period } from "@reeka-office/domain-performance"
import { parseAsString, useQueryState } from "nuqs"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

import { formatPeriod } from "./format"

interface PerformancePeriodFilterProps {
  activePeriod: Period
  className?: string
}

export function PerformancePeriodFilter({
  activePeriod,
  className,
}: PerformancePeriodFilterProps) {
  const [period, setPeriod] = useQueryState(
    "period",
    parseAsString.withOptions({ history: "push", shallow: false }),
  )

  const resolvedValue = period ?? formatPeriod(activePeriod.year, activePeriod.month)

  return (
    <div className={cn("relative w-[160px]", className)}>
      <CalendarIcon className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
      <Input
        type="month"
        value={resolvedValue}
        className="pl-8"
        onChange={(event) => {
          void setPeriod(event.target.value || null)
        }}
      />
    </div>
  )
}
