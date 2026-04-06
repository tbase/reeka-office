export const dynamic = "force-dynamic";

import {
  ListApmPeriodsQuery,
} from "@reeka-office/domain-performance";
import { BarChart3Icon } from "lucide-react";
import { Suspense } from "react";

import { Empty } from "@/components/ui/empty";

import { ApmTable } from "./apm-table";
import { ImportApmDialog } from "./import-apm-dialog";
import { PerformancePeriodFilter } from "./performance-period-filter";
import { parsePerformancePeriod, resolveActivePeriod } from "./search-params";

export default async function PruPerformancePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const requestedPeriod = parsePerformancePeriod(
    typeof params.period === "string" ? params.period : undefined,
  );

  const periods = await new ListApmPeriodsQuery().query();

  if (periods.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">业绩管理</h1>
            <p className="text-muted-foreground text-sm">
              导入并查看代理人业绩数据。
            </p>
          </div>
          <ImportApmDialog />
        </div>

        <Empty
          title="暂无业绩数据。"
          description="导入 CSV 后，这里会显示最新月份的业绩数据。"
          icon={<BarChart3Icon className="size-9 opacity-60" />}
          centered
          className="py-14"
        />
      </div>
    );
  }

  const activePeriod = resolveActivePeriod(periods, requestedPeriod);

  if (!activePeriod) {
    return null;
  }
  return (
    <div className="min-w-0 space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">业绩管理</h1>
            <p className="text-muted-foreground text-sm">
              查看指定月份的代理人业绩数据。
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ImportApmDialog />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">月份</span>
            <PerformancePeriodFilter
              periods={periods}
              activePeriod={activePeriod}
            />
          </div>
        </div>
      </div>

      <Suspense
        key={`${activePeriod.year}-${activePeriod.month}`}
        fallback={<Empty title="正在加载业绩..." />}
      >
        <ApmTable period={activePeriod} />
      </Suspense>
    </div>
  );
}
