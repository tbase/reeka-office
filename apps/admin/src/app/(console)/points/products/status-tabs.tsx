"use client"

import { parseAsStringLiteral, useQueryState } from "nuqs"

import { Button } from "@/components/ui/button"

const STATUSES = ["draft", "published", "off_shelf"] as const
type ProductStatus = (typeof STATUSES)[number]

const STATUS_LABELS: Record<ProductStatus, string> = {
  draft: "草稿",
  published: "已发布",
  off_shelf: "已下架",
}

export function StatusTabs() {
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(STATUSES).withOptions({ history: "push", shallow: false })
  )

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="商品状态筛选">
      <Button
        type="button"
        variant={status === null ? "secondary" : "outline"}
        size="sm"
        role="tab"
        aria-selected={status === null}
        onClick={() => {
          void setStatus(null)
        }}
      >
        全部
      </Button>

      {STATUSES.map((s) => (
        <Button
          key={s}
          type="button"
          variant={status === s ? "secondary" : "outline"}
          size="sm"
          role="tab"
          aria-selected={status === s}
          onClick={() => {
            void setStatus(s)
          }}
        >
          {STATUS_LABELS[s]}
        </Button>
      ))}
    </div>
  )
}
