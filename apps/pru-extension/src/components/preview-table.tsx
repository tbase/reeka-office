import { type ReactNode } from "react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type PreviewTableColumn<T> = {
  key: keyof T
  label: string
  format?: (value: T[keyof T], row: T) => string | number
}

function PreviewTable<T extends Record<string, unknown>>({
  columns,
  rows,
  renderCell,
  stickyColumnCount = 0,
  stickyColumnWidths = [],
}: {
  columns: PreviewTableColumn<T>[]
  rows: T[]
  renderCell: (row: T, column: PreviewTableColumn<T>) => ReactNode
  stickyColumnCount?: number
  stickyColumnWidths?: number[]
}) {
  function getStickyStyle(index: number) {
    if (index >= stickyColumnCount) {
      return undefined
    }

    const left = stickyColumnWidths.slice(0, index).reduce((sum, width) => sum + width, 0)
    const width = stickyColumnWidths[index]

    return {
      left,
      minWidth: width,
      width,
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center px-6 text-sm text-muted-foreground">
        暂无数据，先执行一次抓取。
      </div>
    )
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={String(column.key)}
              className={
                index < stickyColumnCount
                  ? "sticky z-20 bg-slate-100 shadow-[1px_0_0_0_rgba(15,23,42,0.14)]"
                  : undefined
              }
              style={getStickyStyle(index)}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column, columnIndex) => (
              <TableCell
                key={String(column.key)}
                className={
                  columnIndex < stickyColumnCount
                    ? "sticky bg-slate-50 shadow-[1px_0_0_0_rgba(15,23,42,0.12)]"
                    : undefined
                }
                style={getStickyStyle(columnIndex)}
              >
                {renderCell(row, column)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { PreviewTable }
