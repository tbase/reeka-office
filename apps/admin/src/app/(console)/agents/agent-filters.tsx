"use client"

import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"
import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs"

import { Button } from "@/components/ui/button"

import {
  DEFAULT_AGENT_SORT,
  type AgentSort,
  VALID_AGENT_SORTS,
} from "./search-params"

interface AgentFiltersProps {
  agencies: string[]
  activeAgency: string | null
  activeSort: AgentSort
}

function getNextSort(currentSort: AgentSort, field: "designation" | "joinDate"): AgentSort {
  if (field === "designation") {
    return currentSort === "designation_asc" ? "designation_desc" : "designation_asc"
  }

  return currentSort === "join_date_asc" ? "join_date_desc" : "join_date_asc"
}

function isFieldActive(currentSort: AgentSort, field: "designation" | "joinDate") {
  if (field === "designation") {
    return currentSort === "designation_asc" || currentSort === "designation_desc"
  }

  return currentSort === "join_date_asc" || currentSort === "join_date_desc"
}

function SortDirectionIcon({ sort }: { sort: AgentSort }) {
  return sort === "designation_asc" || sort === "join_date_asc"
    ? <ArrowUpIcon className="size-3.5" />
    : <ArrowDownIcon className="size-3.5" />
}

export function AgentFilters({
  agencies,
  activeAgency,
  activeSort,
}: AgentFiltersProps) {
  const [, setAgency] = useQueryState(
    "agency",
    parseAsString.withOptions({ history: "push", shallow: false }),
  )
  const [, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(VALID_AGENT_SORTS).withOptions({
      history: "push",
      shallow: false,
    }),
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="代理机构筛选">
        <Button
          type="button"
          variant={activeAgency === null ? "secondary" : "outline"}
          size="sm"
          role="tab"
          aria-selected={activeAgency === null}
          onClick={() => {
            void setAgency(null)
          }}
        >
          全部
        </Button>

        {agencies.map((agency) => {
          const isActive = activeAgency === agency

          return (
            <Button
              key={agency}
              type="button"
              variant={isActive ? "secondary" : "outline"}
              size="sm"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                void setAgency(agency)
              }}
            >
              {agency}
            </Button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label="代理人排序">
        <Button
          type="button"
          variant={isFieldActive(activeSort, "designation") ? "secondary" : "outline"}
          size="sm"
          aria-pressed={isFieldActive(activeSort, "designation")}
          onClick={() => {
            const nextSort = getNextSort(activeSort, "designation")
            void setSort(nextSort === DEFAULT_AGENT_SORT ? null : nextSort)
          }}
        >
          职级
          {isFieldActive(activeSort, "designation") ? (
            <SortDirectionIcon sort={activeSort} />
          ) : null}
        </Button>

        <Button
          type="button"
          variant={isFieldActive(activeSort, "joinDate") ? "secondary" : "outline"}
          size="sm"
          aria-pressed={isFieldActive(activeSort, "joinDate")}
          onClick={() => {
            const nextSort = getNextSort(activeSort, "joinDate")
            void setSort(nextSort === DEFAULT_AGENT_SORT ? null : nextSort)
          }}
        >
          加入时间
          {isFieldActive(activeSort, "joinDate") ? (
            <SortDirectionIcon sort={activeSort} />
          ) : null}
        </Button>
      </div>
    </div>
  )
}
