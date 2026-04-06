"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

interface StickyTableProps extends React.ComponentProps<"div"> {
  viewportClassName?: string
  tableClassName?: string
}

function StickyTable({
  className,
  viewportClassName,
  tableClassName,
  children,
  ...props
}: StickyTableProps) {
  return (
    <div
      className={cn(
        "w-full max-w-full overflow-hidden rounded-md border",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "max-h-[calc(100vh-16.5rem)] max-w-full overflow-auto",
          viewportClassName,
        )}
      >
        <table
          className={cn(
            "w-max min-w-full border-separate border-spacing-0 text-sm",
            tableClassName,
          )}
        >
          {children}
        </table>
      </div>
    </div>
  )
}

interface StickyTableHeaderCellProps extends React.ComponentProps<"th"> {
  stickyLeft?: boolean
}

function StickyTableHeaderCell({
  stickyLeft = false,
  className,
  ...props
}: StickyTableHeaderCellProps) {
  return (
    <th
      className={cn(
        "sticky top-0 border-b bg-muted px-4 py-2.5 font-medium whitespace-nowrap",
        stickyLeft ? "left-0 z-30 border-r" : "z-20",
        className,
      )}
      {...props}
    />
  )
}

interface StickyTableBodyCellProps extends React.ComponentProps<"td"> {
  stickyLeft?: boolean
}

function StickyTableBodyCell({
  stickyLeft = false,
  className,
  ...props
}: StickyTableBodyCellProps) {
  return (
    <td
      className={cn(
        "px-4 py-3 whitespace-nowrap",
        stickyLeft ? "sticky left-0 z-20 border-r bg-background" : "",
        className,
      )}
      {...props}
    />
  )
}

interface StickyTableFooterCellProps extends React.ComponentProps<"td"> {
  stickyLeft?: boolean
}

function StickyTableFooterCell({
  stickyLeft = false,
  className,
  ...props
}: StickyTableFooterCellProps) {
  return (
    <td
      className={cn(
        "sticky bottom-0 border-t bg-muted px-4 py-3 whitespace-nowrap",
        stickyLeft ? "left-0 z-20 border-r" : "z-10",
        className,
      )}
      {...props}
    />
  )
}

export {
  StickyTable,
  StickyTableBodyCell,
  StickyTableFooterCell,
  StickyTableHeaderCell,
}
