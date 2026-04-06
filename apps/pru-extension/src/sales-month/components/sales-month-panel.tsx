import { PreviewTable } from "@/components/preview-table";
import { ResultPanel } from "@/components/result-panel";
import { Input } from "@/components/ui/input";
import { type StoredWorkdirState } from "@/lib/workdir";
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
    stage,
    error,
    busy,
    previewMeta,
    setMonth,
    fetchAction,
  } = useSalesMonthPanel({
    agentCode,
    workdirState,
  });

  return (
    <ResultPanel
      title="月汇总业绩"
      busy={busy}
      stage={stage}
      error={error}
      rowCount={rows.length}
      fetchAction={fetchAction}
      controls={
        <div className="w-full max-w-[220px] space-y-2">
          <Input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
        </div>
      }
      previewMeta={previewMeta}
    >
      <PreviewTable
        columns={SALES_TABLE_COLUMNS}
        rows={rows}
        stickyColumnCount={2}
        stickyColumnWidths={[96, 132]}
        renderCell={(row, column) =>
          column.format ? column.format(row[column.key], row) : row[column.key]
        }
      />
    </ResultPanel>
  );
}

export { SalesMonthPanel };
