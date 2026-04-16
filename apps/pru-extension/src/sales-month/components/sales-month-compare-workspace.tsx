import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SalesMonthDiffTable } from "@/sales-month/components/sales-month-diff-table"
import { type SalesMonthDiffRow, type SalesMonthDiffSummary } from "@/sales-month/lib/sales-month-diff"
import { type SalesMonthFileOption } from "@/sales-month/lib/sales-month-storage"

function SalesMonthCompareWorkspace({
  monthFiles,
  baseFilePath,
  compareFilePath,
  diffRows,
  diffSummary,
  compareBusy,
  diffError,
  onBaseFileChange,
  onCompareFileChange,
}: {
  monthFiles: SalesMonthFileOption[]
  baseFilePath: string
  compareFilePath: string
  diffRows: SalesMonthDiffRow[]
  diffSummary: SalesMonthDiffSummary
  compareBusy: boolean
  diffError: string
  onBaseFileChange: (value: string) => void
  onCompareFileChange: (value: string) => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {monthFiles.length < 2 ? (
        <Alert className="m-4 border-stone-200 bg-white/90">
          <AlertTitle>暂无可比较文件</AlertTitle>
          <AlertDescription>同月落地文件不足 2 份。</AlertDescription>
        </Alert>
      ) : diffError ? (
        <Alert className="m-4 border-red-200 bg-red-50/90">
          <AlertTitle>对比失败</AlertTitle>
          <AlertDescription>{diffError}</AlertDescription>
        </Alert>
      ) : (
        <div className="min-h-0 flex-1">
          <SalesMonthDiffTable rows={diffRows} />
        </div>
      )}
      <div className="border-t border-border/70 px-4 py-2 text-xs text-muted-foreground">
        A {diffSummary.added} / M {diffSummary.modified} / D {diffSummary.removed}
      </div>
    </div>
  )
}

export { SalesMonthCompareWorkspace }
