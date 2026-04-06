"use client"

import type { ApmPeriod } from "@reeka-office/domain-performance"
import { parseAsString, useQueryState } from "nuqs"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import { formatPeriod } from "./search-params"

interface PerformancePeriodFilterProps {
  periods: readonly ApmPeriod[]
  activePeriod: ApmPeriod
  className?: string
}

export function PerformancePeriodFilter({
  periods,
  activePeriod,
  className,
}: PerformancePeriodFilterProps) {
  const [period, setPeriod] = useQueryState(
    "period",
    parseAsString.withOptions({ history: "push", shallow: false }),
  )

  const latestPeriod = periods[0] ?? null
  const activeValue = formatPeriod(activePeriod.year, activePeriod.month)
  const resolvedValue = periods.some(
    (item) => formatPeriod(item.year, item.month) === period,
  )
    ? period
    : activeValue

  return (
    <Select
      value={resolvedValue}
      onValueChange={(nextValue) => {
        if (latestPeriod && nextValue === formatPeriod(latestPeriod.year, latestPeriod.month)) {
          void setPeriod(null)
          return
        }

        void setPeriod(nextValue)
      }}
    >
      <SelectTrigger className={cn("w-[160px]", className)}>
        <SelectValue placeholder="选择月份" />
      </SelectTrigger>
      <SelectContent>
        {periods.map((item) => {
          const value = formatPeriod(item.year, item.month)

          return (
            <SelectItem key={value} value={value}>
              {value}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
