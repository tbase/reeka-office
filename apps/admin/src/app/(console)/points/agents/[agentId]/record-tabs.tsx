"use client"

import { parseAsStringLiteral, useQueryState } from "nuqs"

import { Button } from "@/components/ui/button"

const RECORD_TABS = ["grants", "redemptions"] as const

type RecordTab = (typeof RECORD_TABS)[number]

const TAB_LABELS: Record<RecordTab, string> = {
  grants: "发放记录",
  redemptions: "兑换记录",
}

export function RecordTabs({ activeTab }: { activeTab: RecordTab }) {
  const [, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(RECORD_TABS).withOptions({ history: "push", shallow: false }),
  )

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="积分记录类型">
      {RECORD_TABS.map((tab) => {
        const isActive = tab === activeTab

        return (
          <Button
            key={tab}
            type="button"
            variant={isActive ? "secondary" : "outline"}
            size="sm"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              void setTab(tab === "grants" ? null : tab)
            }}
          >
            {TAB_LABELS[tab]}
          </Button>
        )
      })}
    </div>
  )
}
