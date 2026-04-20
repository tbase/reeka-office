import { BarChart3Icon } from "lucide-react"

import {
  ListApmYearlyStatsQuery,
  type Period,
} from "@reeka-office/domain-performance"

import { Empty } from "@/components/ui/empty"

import { PerformanceYearFilter } from "./year-filter"
import { PerformanceYearlyChart } from "./yearly-chart"
import { resolveActiveYear, resolveYearOptions } from "./search-params"

interface PerformanceStatsSectionProps {
  periods: readonly Period[]
  requestedYear?: string | null
}

export async function PerformanceStatsSection({
  periods,
  requestedYear,
}: PerformanceStatsSectionProps) {
  const years = resolveYearOptions(periods)
  const activeYear = resolveActiveYear(periods, requestedYear ?? null)

  if (!activeYear || years.length === 0) {
    return (
      <Empty
        title="暂无统计数据。"
        description="导入 CSV 后，这里会显示按月汇总的统计数据。"
        icon={<BarChart3Icon className="size-9 opacity-60" />}
        centered
        className="py-14"
      />
    )
  }

  const stats = await new ListApmYearlyStatsQuery({ year: activeYear }).query()

  if (stats.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">年份</span>
            <PerformanceYearFilter years={years} activeYear={activeYear} />
          </div>
          <p className="text-muted-foreground text-xs">
            {activeYear} 年暂无统计数据。
          </p>
        </div>

        <Empty
          title="当前年份暂无统计数据。"
          description="切换年份或重新导入 CSV 文件后再查看统计图表。"
          icon={<BarChart3Icon className="size-9 opacity-60" />}
          centered
          className="py-14"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">年份</span>
          <PerformanceYearFilter years={years} activeYear={activeYear} />
        </div>
        <p className="text-muted-foreground text-xs">
          {activeYear} 年按月汇总 NSC / CASE 数据。
        </p>
      </div>

      <div className="rounded-md border p-4">
        <PerformanceYearlyChart data={stats} />
      </div>
    </div>
  )
}
