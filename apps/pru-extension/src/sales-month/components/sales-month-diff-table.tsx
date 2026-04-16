import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { SALES_TABLE_COLUMNS, type SerializedSalesMonthRow } from "@/sales-month/lib/sales-month-format"
import { type SalesMonthDiffRow } from "@/sales-month/lib/sales-month-diff"
import { type SalesMonthRow } from "@/lib/pru"

function SalesMonthDiffTable({ rows }: { rows: SalesMonthDiffRow[] }) {
  function getStickyStyle(index: number) {
    const stickyColumnWidths = [56, 96, 132]

    if (index >= stickyColumnWidths.length) {
      return undefined
    }

    return {
      left: stickyColumnWidths.slice(0, index).reduce((sum, width) => sum + width, 0),
      minWidth: stickyColumnWidths[index],
      width: stickyColumnWidths[index],
    }
  }

  function formatValue(
    row: SerializedSalesMonthRow,
    column: (typeof SALES_TABLE_COLUMNS)[number],
  ) {
    return column.format
      ? column.format(row[column.key], row as unknown as SalesMonthRow)
      : row[column.key]
  }

  function isChangedValue(diffRow: SalesMonthDiffRow, key: keyof SerializedSalesMonthRow) {
    return diffRow.changeType === "modified" && diffRow.previousRow[key] !== diffRow.row[key]
  }

  function getRowClassName(changeType: SalesMonthDiffRow["changeType"]) {
    if (changeType === "added") {
      return "bg-emerald-50/80"
    }

    if (changeType === "removed") {
      return "bg-red-50/80"
    }

    return "bg-amber-50/80"
  }

  function getStickyCellClassName(changeType: SalesMonthDiffRow["changeType"]) {
    if (changeType === "added") {
      return "bg-emerald-50/95"
    }

    if (changeType === "removed") {
      return "bg-red-50/95"
    }

    return "bg-amber-50/95"
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center px-6 text-sm text-muted-foreground">
        选中的两份文件没有检测到差异。
      </div>
    )
  }

  return (
    <Table className="min-w-max">
      <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
        <TableRow>
          <TableHead className="sticky z-20 bg-slate-100 shadow-[1px_0_0_0_rgba(15,23,42,0.14)]" style={getStickyStyle(0)}>
            CHG
          </TableHead>
          {SALES_TABLE_COLUMNS.map((column, index) => (
            <TableHead
              key={String(column.key)}
              className={
                index < 2
                  ? "sticky z-20 bg-slate-100 shadow-[1px_0_0_0_rgba(15,23,42,0.14)]"
                  : undefined
              }
              style={getStickyStyle(index + 1)}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((diffRow, index) => (
          <TableRow key={`${diffRow.marker}-${diffRow.row.agent_code}-${index}`} className={getRowClassName(diffRow.changeType)}>
            <TableCell
              className={cn(
                "sticky text-center font-semibold shadow-[1px_0_0_0_rgba(15,23,42,0.12)]",
                getStickyCellClassName(diffRow.changeType),
              )}
              style={getStickyStyle(0)}
            >
              {diffRow.marker}
            </TableCell>
            {SALES_TABLE_COLUMNS.map((column, columnIndex) => (
              <TableCell
                key={String(column.key)}
                className={cn(
                  columnIndex < 2
                    ? `sticky shadow-[1px_0_0_0_rgba(15,23,42,0.12)] ${getStickyCellClassName(diffRow.changeType)}`
                    : undefined,
                  isChangedValue(diffRow, column.key as keyof SerializedSalesMonthRow)
                    ? "bg-amber-100/80"
                    : undefined,
                )}
                style={getStickyStyle(columnIndex + 1)}
              >
                {diffRow.changeType === "modified" &&
                isChangedValue(diffRow, column.key as keyof SerializedSalesMonthRow) ? (
                  <div className="space-y-1">
                    <div className="text-[11px] text-red-700 line-through">
                      {formatValue(diffRow.previousRow, column)}
                    </div>
                    <div className="font-medium text-amber-950">{formatValue(diffRow.row, column)}</div>
                  </div>
                ) : (
                  formatValue(diffRow.row, column)
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { SalesMonthDiffTable }
