"use client";

import { QueryTabs } from "@/components/query-tabs";

import type { PerformanceView } from "./search-params";

interface PerformanceViewTabsProps {
  activeView: PerformanceView;
}

const viewOptions: Array<{
  label: string;
  value: PerformanceView | null;
}> = [
  { label: "明细数据", value: null },
  { label: "统计数据", value: "stats" },
];

export function PerformanceViewTabs({ activeView }: PerformanceViewTabsProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="flex min-w-0 flex-wrap items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            业绩管理
          </h1>
        </div>

        <QueryTabs
          queryKey="view"
          options={viewOptions}
          ariaLabel="业绩视图"
          defaultValue={null}
          activeValue={activeView === "table" ? null : activeView}
          clearOnDefault
        />
      </div>
    </div>
  );
}
