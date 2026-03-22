"use client"

import { QueryTabs } from "@/components/query-tabs"

type CategoryTabsProps = {
  categories: string[]
}

export function CategoryTabs({ categories }: CategoryTabsProps) {
  const options = [
    { label: "全部", value: null },
    ...categories.map((category) => ({
      label: category,
      value: category,
    })),
  ]

  return (
    <QueryTabs queryKey="category" options={options} ariaLabel="积分事项类别筛选" />
  )
}
