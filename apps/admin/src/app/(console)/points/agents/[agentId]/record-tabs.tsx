"use client"

import { QueryTabs } from "@/components/query-tabs"

type RecordTab = "grants" | "redemptions"

const TAB_OPTIONS = [
  { label: "发放记录", value: "grants" },
  { label: "兑换记录", value: "redemptions" },
] as const satisfies ReadonlyArray<{
  label: string
  value: RecordTab
}>

export function RecordTabs({ activeTab }: { activeTab: RecordTab }) {
  return (
    <QueryTabs
      queryKey="tab"
      options={TAB_OPTIONS}
      ariaLabel="积分记录类型"
      defaultValue="grants"
      activeValue={activeTab}
      clearOnDefault
    />
  )
}
