import { AGENT_COLUMNS } from "@/agents/lib/agent-columns"
import { type AgentDiffRow } from "@/agents/lib/agent-diff"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { type AgentRow } from "@/lib/pru"

function AgentsDiffTable({ rows }: { rows: AgentDiffRow[] }) {
  function getStickyStyle(index: number) {
    const stickyColumnWidths = [56, 132]

    if (index >= stickyColumnWidths.length) {
      return undefined
    }

    return {
      left: stickyColumnWidths.slice(0, index).reduce((sum, width) => sum + width, 0),
      minWidth: stickyColumnWidths[index],
      width: stickyColumnWidths[index],
    }
  }

  function getRowClassName(changeType: AgentDiffRow["changeType"]) {
    if (changeType === "added") {
      return "bg-emerald-50/80"
    }

    if (changeType === "removed") {
      return "bg-red-50/80"
    }

    return "bg-amber-50/80"
  }

  function getStickyCellClassName(changeType: AgentDiffRow["changeType"]) {
    if (changeType === "added") {
      return "bg-emerald-50/95"
    }

    if (changeType === "removed") {
      return "bg-red-50/95"
    }

    return "bg-amber-50/95"
  }

  function isChangedValue(diffRow: AgentDiffRow, key: keyof AgentRow) {
    return diffRow.changeType === "modified" && diffRow.previousRow[key] !== diffRow.row[key]
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
          <TableHead
            className="sticky z-20 bg-slate-100 shadow-[1px_0_0_0_rgba(15,23,42,0.14)]"
            style={getStickyStyle(0)}
          >
            CHG
          </TableHead>
          {AGENT_COLUMNS.map((column, index) => (
            <TableHead
              key={String(column.key)}
              className={
                index === 0
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
          <TableRow
            key={`${diffRow.marker}-${diffRow.row.agent_code}-${index}`}
            className={getRowClassName(diffRow.changeType)}
          >
            <TableCell
              className={cn(
                "sticky text-center font-semibold shadow-[1px_0_0_0_rgba(15,23,42,0.12)]",
                getStickyCellClassName(diffRow.changeType),
              )}
              style={getStickyStyle(0)}
            >
              {diffRow.marker}
            </TableCell>
            {AGENT_COLUMNS.map((column, columnIndex) => (
              <TableCell
                key={String(column.key)}
                className={cn(
                  columnIndex === 0
                    ? `sticky shadow-[1px_0_0_0_rgba(15,23,42,0.12)] ${getStickyCellClassName(diffRow.changeType)}`
                    : undefined,
                  isChangedValue(diffRow, column.key) ? "bg-amber-100/80" : undefined,
                )}
                style={getStickyStyle(columnIndex + 1)}
              >
                {diffRow.changeType === "modified" && isChangedValue(diffRow, column.key) ? (
                  <div className="space-y-1">
                    <div className="text-[11px] text-red-700 line-through">
                      {diffRow.previousRow[column.key]}
                    </div>
                    <div className="font-medium text-amber-950">{diffRow.row[column.key]}</div>
                  </div>
                ) : (
                  diffRow.row[column.key]
                )}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export { AgentsDiffTable }
