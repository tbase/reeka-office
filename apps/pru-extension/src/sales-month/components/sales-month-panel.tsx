import { PreviewTable } from "@/components/preview-table";
import { ResultPanel } from "@/components/result-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type StoredWorkdirState } from "@/lib/workdir";
import { SalesMonthCompareWorkspace } from "@/sales-month/components/sales-month-compare-workspace";
import { useSalesMonthPanel } from "@/sales-month/hooks/use-sales-month-panel";
import { SALES_TABLE_COLUMNS } from "@/sales-month/lib/sales-month-format";

function SalesMonthPanel({
  agentCode,
  workdirState,
}: {
  agentCode: string;
  workdirState: StoredWorkdirState;
}) {
  const {
    month,
    rows,
    monthFiles,
    baseFilePath,
    compareFilePath,
    compareMode,
    compareBusy,
    diffRows,
    diffSummary,
    diffError,
    stage,
    error,
    busy,
    previewMeta,
    canEnterCompare,
    setMonth,
    setBaseFilePath,
    setCompareFilePath,
    openCompareAction,
    closeCompareAction,
    fetchAction,
  } = useSalesMonthPanel({
    agentCode,
    workdirState,
  });

  const monthFileItems = monthFiles.map((option) => ({
    value: option.path,
    label: option.label,
  }));

  return (
    <ResultPanel
      title="月汇总业绩"
      busy={busy}
      stage={stage}
      error={error}
      rowCount={compareMode ? diffRows.length : rows.length}
      fetchAction={compareMode ? undefined : fetchAction}
      controls={
        compareMode ? (
          <div className="grid w-full gap-3 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0">
              <Select
                items={monthFileItems}
                value={baseFilePath}
                onValueChange={(value) => setBaseFilePath(String(value ?? ""))}
                disabled={monthFiles.length < 2 || compareBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择基准文件" />
                </SelectTrigger>
                <SelectContent>
                  {monthFiles.map((option) => (
                    <SelectItem key={option.path} value={option.path}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="hidden text-sm font-medium text-muted-foreground xl:flex xl:items-center">
              vs
            </div>
            <div className="min-w-0">
              <Select
                items={monthFileItems}
                value={compareFilePath}
                onValueChange={(value) => setCompareFilePath(String(value ?? ""))}
                disabled={monthFiles.length < 2 || compareBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择当前文件" />
                </SelectTrigger>
                <SelectContent>
                  {monthFiles.map((option) => (
                    <SelectItem key={option.path} value={option.path}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={closeCompareAction} disabled={compareBusy}>
                返回预览
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex w-full flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <Input
              type="month"
              className="w-full max-w-[220px]"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
            />
            <div className="flex flex-wrap gap-2">
              {canEnterCompare ? (
                <Button variant="outline" onClick={openCompareAction}>
                  进入对比
                </Button>
              ) : null}
            </div>
          </div>
        )
      }
      previewMeta={previewMeta}
    >
      {compareMode ? (
        <SalesMonthCompareWorkspace
          monthFiles={monthFiles}
          baseFilePath={baseFilePath}
          compareFilePath={compareFilePath}
          diffRows={diffRows}
          diffSummary={diffSummary}
          compareBusy={compareBusy}
          diffError={diffError}
          onBaseFileChange={setBaseFilePath}
          onCompareFileChange={setCompareFilePath}
        />
      ) : (
        <PreviewTable
          columns={SALES_TABLE_COLUMNS}
          rows={rows}
          stickyColumnCount={2}
          stickyColumnWidths={[96, 132]}
          renderCell={(row, column) =>
            column.format ? column.format(row[column.key], row) : row[column.key]
          }
        />
      )}
    </ResultPanel>
  );
}

export { SalesMonthPanel };
