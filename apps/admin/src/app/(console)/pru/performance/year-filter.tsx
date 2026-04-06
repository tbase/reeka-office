"use client"

import { parseAsString, useQueryState } from "nuqs"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

interface PerformanceYearFilterProps {
  years: readonly number[]
  activeYear: number
  className?: string
}

export function PerformanceYearFilter({
  years,
  activeYear,
  className,
}: PerformanceYearFilterProps) {
  const [year, setYear] = useQueryState(
    "year",
    parseAsString.withOptions({ history: "push", shallow: false }),
  )

  const latestYear = years[0] ?? null
  const resolvedYear = years.some((item) => String(item) === year)
    ? year
    : String(activeYear)

  return (
    <Select
      value={resolvedYear}
      onValueChange={(nextValue) => {
        if (latestYear && nextValue === String(latestYear)) {
          void setYear(null)
          return
        }

        void setYear(nextValue)
      }}
    >
      <SelectTrigger className={cn("w-[120px]", className)}>
        <SelectValue placeholder="选择年份" />
      </SelectTrigger>
      <SelectContent>
        {years.map((item) => (
          <SelectItem key={item} value={String(item)}>
            {item}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
