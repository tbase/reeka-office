"use client"

import { QueryTabs } from "@/components/query-tabs"

import type { PlanStatusFilter } from "./search-params"

const STATUS_OPTIONS = [
  { label: "已发布", value: "published" },
  { label: "草稿", value: "draft" },
  { label: "归档", value: "archived" },
] as const satisfies ReadonlyArray<{
  label: string
  value: PlanStatusFilter
}>

export function PlanStatusTabs() {
  return (
    <QueryTabs
      queryKey="status"
      options={STATUS_OPTIONS}
      ariaLabel="计划状态筛选"
      defaultValue="published"
    />
  )
}
