"use client"

import { parseAsInteger, useQueryState } from "nuqs"

import { Button } from "@/components/ui/button"

type CategoryTabItem = {
  id: number
  name: string
}

export function CategoryTabs({
  categories,
}: {
  categories: CategoryTabItem[]
}) {
  const [categoryId, setCategoryId] = useQueryState(
    "categoryId",
    parseAsInteger.withOptions({ history: "push", shallow: false })
  )

  const activeCategoryId = categoryId ?? null

  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="内容分类筛选">
      <Button
        type="button"
        variant={activeCategoryId === null ? "secondary" : "outline"}
        size="sm"
        role="tab"
        aria-selected={activeCategoryId === null}
        onClick={() => {
          void setCategoryId(null)
        }}
      >
        全部
      </Button>

      {categories.map((category) => {
        const isActive = activeCategoryId === category.id

        return (
          <Button
            key={category.id}
            type="button"
            variant={isActive ? "secondary" : "outline"}
            size="sm"
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              void setCategoryId(category.id)
            }}
          >
            {category.name}
          </Button>
        )
      })}
    </div>
  )
}
