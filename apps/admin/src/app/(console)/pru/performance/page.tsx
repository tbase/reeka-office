export const dynamic = "force-dynamic";

import {
  ListApmPeriodsQuery,
} from "@reeka-office/domain-performance";
import { PerformanceDetailSection } from "./detail-section";
import { PerformanceStatsSection } from "./stats-section";
import { PerformanceViewTabs } from "./view-tabs";
import { parsePerformancePeriod, parsePerformanceView } from "./search-params";

export default async function PruPerformancePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const activeView =
    parsePerformanceView(typeof params.view === "string" ? params.view : undefined) ??
    "table";
  const requestedPeriod =
    typeof params.period === "string" ? parsePerformancePeriod(params.period) : null;

  return (
    <div className="min-w-0 space-y-4">
      <PerformanceViewTabs activeView={activeView} />
      {activeView === "stats" ? (
        <PerformanceStatsSection
          periods={await new ListApmPeriodsQuery().query()}
          requestedYear={typeof params.year === "string" ? params.year : null}
        />
      ) : (
        <PerformanceDetailSection
          latestPeriod={
            requestedPeriod
              ? null
              : (await new ListApmPeriodsQuery({ limit: 1 }).query())[0] ?? null
          }
          requestedPeriod={requestedPeriod}
        />
      )}
    </div>
  );
}
