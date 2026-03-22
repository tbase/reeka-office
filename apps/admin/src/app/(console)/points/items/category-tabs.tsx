"use client"

import { parseAsString, useQueryState } from "nuqs"

import { Button } from "@/components/ui/button"

type CategoryTabsProps = {
  categories: string[]
}

export function CategoryTabs({ categories }: CategoryTabsProps) {
  const [category, setCategory] = useQueryState(
    "category",
    parseAsString.withOptions({ history: "push", shallow: false })
  )

  const activeCategory = category ?? null

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="积分事项类别筛选">
      <Button
        type="button"
        variant={activeCategory === null ? "secondary" : "outline"}
        size="sm"
        role="tab"
        aria-selected={activeCategory === null}
        onClick={() => {
          void setCategory(null)
        }}
      >
        全部
      </Button>

      {categories.map((item) => {
        const isActive = activeCategory === item

        return (
          <Button
            key={item}
            type="button"
            variant={isActive ? "secondary" : "outline"}
            size="sm"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              void setCategory(item)
            }}
          >
            {item}
          </Button>
        )
      })}
    </div>
  )
}
