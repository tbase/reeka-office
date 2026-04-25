"use client"

import * as React from "react"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SimpleSelect } from "@/components/ui/simple-select"

import type { AgentLogsSearchParams } from "./search-params"

const CATEGORY_OPTIONS = [
  { value: "all", label: "全部分类" },
  { value: "profile", label: "主档" },
  { value: "apm", label: "APM" },
] as const

export function AgentLogsFilterForm({
  category: initialCategory,
  month: initialMonth,
}: AgentLogsSearchParams) {
  const [categoryQuery, setCategoryQuery] = useQueryState(
    "category",
    parseAsStringLiteral(["profile", "apm"]).withOptions({
      history: "replace",
      shallow: false,
    }),
  )
  const [monthQuery, setMonthQuery] = useQueryState(
    "month",
    parseAsString.withOptions({
      history: "replace",
      shallow: false,
    }),
  )
  const [isPending, startTransition] = React.useTransition()
  const resolvedCategory = categoryQuery ?? initialCategory
  const resolvedMonth = monthQuery ?? initialMonth
  const [category, setCategory] = React.useState(resolvedCategory)
  const [month, setMonth] = React.useState(resolvedMonth)

  React.useEffect(() => {
    setCategory(resolvedCategory)
    setMonth(resolvedMonth)
  }, [resolvedCategory, resolvedMonth])

  function navigate(nextCategory: typeof category, nextMonth: string) {
    startTransition(() => {
      void Promise.all([
        setCategoryQuery(nextCategory === "all" ? null : nextCategory),
        setMonthQuery(nextMonth),
      ])
    })
  }

  return (
    <form
      className="grid gap-3 md:grid-cols-[180px_1fr_auto]"
      onSubmit={(event) => {
        event.preventDefault()
        navigate(category, month)
      }}
    >
      <SimpleSelect
        value={category}
        onValueChange={(value) => setCategory((value as typeof category) ?? "all")}
        items={[...CATEGORY_OPTIONS]}
        placeholder="选择分类"
        triggerClassName="w-full"
      />
      <Input
        type="month"
        value={month}
        onChange={(event) => setMonth(event.target.value)}
      />
      <Button type="submit" disabled={isPending}>
        查询
      </Button>
    </form>
  )
}
