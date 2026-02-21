"use client"

import * as React from "react"
import { Select as SelectPrimitive } from "@base-ui/react/select"

import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type SimpleSelectItem = {
  value: string
  label: string
}

type SimpleSelectProps = Omit<React.ComponentProps<typeof SelectPrimitive.Root>, "items"> & {
  items: SimpleSelectItem[]
  placeholder?: string
  triggerClassName?: string
}

export function SimpleSelect({ items, placeholder, triggerClassName, ...rootProps }: SimpleSelectProps) {
  return (
    <Select items={items} {...rootProps}>
      <SelectTrigger className={cn("w-full", triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item: SimpleSelectItem) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
