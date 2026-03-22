"use client"

import { parseAsString, useQueryState } from "nuqs"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type QueryTabOption<T extends string> = {
  label: string
  value: T | null
}

type QueryTabsProps<T extends string> = {
  queryKey: string
  options: readonly QueryTabOption<T>[]
  ariaLabel: string
  defaultValue?: T | null
  activeValue?: T | null
  clearOnDefault?: boolean
}

export function QueryTabs<T extends string>({
  queryKey,
  options,
  ariaLabel,
  defaultValue,
  activeValue,
  clearOnDefault = false,
}: QueryTabsProps<T>) {
  const [queryValue, setQueryValue] = useQueryState(
    queryKey,
    parseAsString.withOptions({ history: "push", shallow: false }),
  )

  const fallbackValue = defaultValue ?? null
  const resolvedValue = options.some((option) => option.value === queryValue)
    ? queryValue
    : fallbackValue
  const currentValue = activeValue ?? resolvedValue

  return (
    <Tabs
      value={currentValue ?? "__all__"}
      onValueChange={(nextValue) => {
        const matchedOption = options.find((option) => {
          const optionValue = option.value ?? "__all__"
          return optionValue === nextValue
        })

        if (!matchedOption) {
          return
        }

        const nextQueryValue = clearOnDefault && matchedOption.value === defaultValue
          ? null
          : matchedOption.value

        void setQueryValue(nextQueryValue)
      }}
    >
      <TabsList aria-label={ariaLabel} className="h-auto flex-wrap justify-start">
        {options.map((option) => (
          <TabsTrigger
            key={option.value ?? "__all__"}
            value={option.value ?? "__all__"}
          >
            {option.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}
