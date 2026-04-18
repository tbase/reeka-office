"use client";

import { PlusCircleIcon } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface FilterBoxOption {
  value: string;
  label: string;
}

interface FilterBoxProps {
  title: string;
  options: FilterBoxOption[];
  value: string[];
  onChange: (value: string[]) => void;
  clearText?: string;
  disabled?: boolean;
  className?: string;
}

export function FilterBox({
  title,
  options,
  value,
  onChange,
  clearText = "清空",
  disabled = false,
  className,
}: FilterBoxProps) {
  const selectedValues = useMemo(
    () => value.filter((item) => item.length > 0),
    [value],
  );
  const selectedValueSet = useMemo(
    () => new Set(selectedValues),
    [selectedValues],
  );

  const handleSelect = (nextValue: string) => {
    const nextSet = new Set(selectedValueSet);

    if (nextSet.has(nextValue)) {
      nextSet.delete(nextValue);
    } else {
      nextSet.add(nextValue);
    }

    onChange(Array.from(nextSet));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            type="button"
            variant="outline"
            className={cn("border-dashed", className)}
            disabled={disabled}
          />
        }
      >
        <PlusCircleIcon className="size-4" />
        {title}
        {selectedValues.length > 0 ? (
          <>
            <Separator orientation="vertical" className="mx-1 h-4" />
            <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
              {selectedValues.length}
            </Badge>
            <div className="hidden items-center gap-1 lg:flex">
              {selectedValues.length > 2 ? (
                <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                  已选 {selectedValues.length}
                </Badge>
              ) : (
                selectedValues.map((selectedValue) => (
                  <Badge
                    key={selectedValue}
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {options.find((option) => option.value === selectedValue)?.label ?? selectedValue}
                  </Badge>
                ))
              )}
            </div>
          </>
        ) : null}
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selectedValueSet.has(option.value)}
            closeOnClick={false}
            onCheckedChange={() => handleSelect(option.value)}
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}

        {selectedValues.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center text-center"
              onClick={() => onChange([])}
            >
              {clearText}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
