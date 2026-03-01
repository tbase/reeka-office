"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import * as React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type SimpleSelectItem = {
  value: string;
  label: string;
  icon?: React.ReactNode;
};

type SimpleSelectProps = Omit<
  React.ComponentProps<typeof SelectPrimitive.Root>,
  "items"
> & {
  items: SimpleSelectItem[];
  placeholder?: string;
  triggerClassName?: string;
};

export function SimpleSelect({
  items,
  placeholder,
  triggerClassName,
  ...rootProps
}: SimpleSelectProps) {
  const hasIcons = items.some((item) => item.icon != null);
  return (
    <Select items={items} {...rootProps}>
      <SelectTrigger className={cn("w-full", triggerClassName)}>
        <SelectValue placeholder={placeholder}>
          {hasIcons
            ? (value: string | null) => {
                if (value == null) return null;
                const item = items.find((i) => i.value === value);
                if (!item) return value;
                return (
                  <span className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </span>
                );
              }
            : undefined}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {items.map((item: SimpleSelectItem) => (
          <SelectItem key={item.value} value={item.value}>
            <span className="flex items-center gap-2">
              {item.icon}
              {item.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
