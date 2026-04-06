import { BarChart3Icon } from "lucide-react"
import { Suspense } from "react"

import type { ApmPeriod } from "@reeka-office/domain-performance"

import { Empty } from "@/components/ui/empty"

import { ApmTable } from "./apm-table"
import { ImportApmDialog } from "./import-apm-dialog"
import { PerformancePeriodFilter } from "./period-filter"
import { resolveActivePeriod } from "./search-params"

interface PerformanceDetailSectionProps {
  latestPeriod: ApmPeriod | null
  requestedPeriod?: string | null
}

export function PerformanceDetailSection({
  latestPeriod,
  requestedPeriod,
}: PerformanceDetailSectionProps) {
  const activePeriod = resolveActivePeriod(requestedPeriod ?? null, latestPeriod)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {activePeriod ? (
            <>
              <span className="text-muted-foreground text-sm">月份</span>
              <PerformancePeriodFilter activePeriod={activePeriod} />
            </>
          ) : null}
        </div>
        <ImportApmDialog />
      </div>

      {activePeriod ? (
        <Suspense
          key={`${activePeriod.year}-${activePeriod.month}`}
          fallback={<Empty title="正在加载业绩..." />}
        >
          <ApmTable period={activePeriod} />
        </Suspense>
      ) : (
        <Empty
          title="暂无业绩数据。"
          description="导入 CSV 后，这里会显示最新月份的业绩数据。"
          icon={<BarChart3Icon className="size-9 opacity-60" />}
          centered
          className="py-14"
        />
      )}
    </div>
  )
}
