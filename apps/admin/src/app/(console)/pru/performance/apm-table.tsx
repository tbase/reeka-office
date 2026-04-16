import { BarChart3Icon } from "lucide-react";

import {
  ListApmQuery,
  type ApmListItem,
  type ApmPeriod,
} from "@reeka-office/domain-performance";

import {
  StickyTable,
  StickyTableBodyCell,
  StickyTableFooterCell,
  StickyTableHeaderCell,
} from "@/components/ui/sticky-table";
import { cn } from "@/lib/utils";
import {
  formatCount,
  formatMoney,
  formatRate,
} from "./format";

const agentColumnClass = "w-[220px] min-w-[220px] max-w-[220px]";

interface APMTableProps {
  period: ApmPeriod;
  className?: string;
}

type Column = {
  key: string;
  label: string;
  className?: string;
  getValue?: (row: ApmListItem) => number;
  render: (row: ApmListItem) => React.ReactNode;
  renderSummary?: (rows: ApmListItem[]) => React.ReactNode;
  renderSummaryValue?: (value: number) => string;
};

function sumRows(rows: ApmListItem[], getValue: (row: ApmListItem) => number) {
  return rows.reduce((total, row) => total + getValue(row), 0);
}

function formatGap(value: number | null) {
  return value == null ? "-" : formatMoney(value);
}

function renderGap(value: number | null) {
  return (
    <span className={value != null && value < 0 ? "text-destructive" : undefined}>
      {formatGap(value)}
    </span>
  );
}

function formatQualificationSummary(
  rows: ApmListItem[],
  getGap: (row: ApmListItem) => number | null,
) {
  let qualified = 0;
  let unqualified = 0;

  for (const row of rows) {
    const gap = getGap(row);
    if (gap == null) {
      continue;
    }

    if (gap >= 0) {
      qualified += 1;
    } else {
      unqualified += 1;
    }
  }

  return (
    <>
      <span className="text-success">{qualified}</span> vs{" "}
      <span className="text-destructive">{unqualified}</span>
    </>
  );
}

function renderColumnSummary(column: Column, rows: ApmListItem[]) {
  if (column.renderSummary) {
    return column.renderSummary(rows);
  }

  if (column.renderSummaryValue && column.getValue) {
    return column.renderSummaryValue(sumRows(rows, column.getValue));
  }

  return "-";
}

const columns: Column[] = [
  {
    key: "nsc",
    label: "NSC",
    className: "text-right",
    getValue: (row) => row.nsc,
    render: (row) => formatMoney(row.nsc),
    renderSummaryValue: formatMoney,
  },
  {
    key: "nscSum",
    label: "NSC SUM",
    className: "text-right",
    getValue: (row) => row.nscSum,
    render: (row) => formatMoney(row.nscSum),
    renderSummaryValue: formatMoney,
  },
  {
    key: "netAfyp",
    label: "AFYP",
    className: "text-right",
    getValue: (row) => row.netAfyp,
    render: (row) => formatMoney(row.netAfyp),
    renderSummaryValue: formatMoney,
  },
  {
    key: "netAfypSum",
    label: "AFYP SUM",
    className: "text-right",
    getValue: (row) => row.netAfypSum,
    render: (row) => formatMoney(row.netAfypSum),
    renderSummaryValue: formatMoney,
  },
  {
    key: "netCase",
    label: "CASE",
    className: "text-right",
    getValue: (row) => row.netCase,
    render: (row) => formatCount(row.netCase),
    renderSummaryValue: formatCount,
  },
  {
    key: "netCaseSum",
    label: "CASE SUM",
    className: "text-right",
    getValue: (row) => row.netCaseSum,
    render: (row) => formatCount(row.netCaseSum),
    renderSummaryValue: formatCount,
  },
  {
    key: "isQualified",
    label: "QHC",
    className: "text-right",
    getValue: (row) => row.isQualified,
    render: (row) => formatCount(row.isQualified),
    renderSummaryValue: formatCount,
  },
  {
    key: "netAfycSum",
    label: "AFYC SUM",
    className: "text-right",
    getValue: (row) => row.netAfycSum,
    render: (row) => formatMoney(row.netAfycSum),
    renderSummaryValue: formatMoney,
  },
  {
    key: "nscHp",
    label: "NSC HP",
    className: "text-right",
    getValue: (row) => row.nscHp,
    render: (row) => formatMoney(row.nscHp),
    renderSummaryValue: formatMoney,
  },
  {
    key: "nscHpSum",
    label: "NSC HP SUM",
    className: "text-right",
    getValue: (row) => row.nscHpSum,
    render: (row) => formatMoney(row.nscHpSum),
    renderSummaryValue: formatMoney,
  },
  {
    key: "netAfypHp",
    label: "AFYP HP",
    className: "text-right",
    getValue: (row) => row.netAfypHp,
    render: (row) => formatMoney(row.netAfypHp),
    renderSummaryValue: formatMoney,
  },
  {
    key: "netAfypHpSum",
    label: "AFYP HP SUM",
    className: "text-right",
    getValue: (row) => row.netAfypHpSum,
    render: (row) => formatMoney(row.netAfypHpSum),
    renderSummaryValue: formatMoney,
  },
  {
    key: "netAfypH",
    label: "AFYP H",
    className: "text-right",
    getValue: (row) => row.netAfypH,
    render: (row) => formatMoney(row.netAfypH),
    renderSummaryValue: formatMoney,
  },
  {
    key: "netAfypHSum",
    label: "AFYP H SUM",
    className: "text-right",
    getValue: (row) => row.netAfypHSum,
    render: (row) => formatMoney(row.netAfypHSum),
    renderSummaryValue: formatMoney,
  },
  {
    key: "netCaseH",
    label: "CASE H",
    className: "text-right",
    getValue: (row) => row.netCaseH,
    render: (row) => formatCount(row.netCaseH),
    renderSummaryValue: formatCount,
  },
  {
    key: "netCaseHSum",
    label: "CASE H SUM",
    className: "text-right",
    getValue: (row) => row.netCaseHSum,
    render: (row) => formatCount(row.netCaseHSum),
    renderSummaryValue: formatCount,
  },
  {
    key: "renewalRateTeam",
    label: "团队续保率",
    className: "text-right",
    getValue: (row) => row.renewalRateTeam,
    render: (row) => formatRate(row.renewalRateTeam),
  },
  {
    key: "qualifiedGap",
    label: "当月合资格差距",
    className: "text-right",
    render: (row) => renderGap(row.qualifiedGap),
    renderSummary: (rows) => formatQualificationSummary(rows, (row) => row.qualifiedGap),
  },
  {
    key: "qualifiedGapNextMonth",
    label: "下月合资格差距",
    className: "text-right",
    render: (row) => renderGap(row.qualifiedGapNextMonth),
    renderSummary: (rows) => formatQualificationSummary(rows, (row) => row.qualifiedGapNextMonth),
  },
];

export async function ApmTable({ period, className }: APMTableProps) {
  const rows = await new ListApmQuery(period).query();

  if (rows.length === 0) {
    return (
      <div
        className={cn(
          "w-full max-w-full overflow-hidden rounded-md border",
          className,
        )}
      >
        <div className="flex min-h-[calc(100vh-17rem)] flex-col items-center justify-center gap-3 px-6 text-center">
          <BarChart3Icon className="size-9 opacity-60" />
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              当前月份暂无业绩数据。
            </p>
            <p className="text-muted-foreground text-xs">
              请切换月份或重新导入 CSV 文件。
            </p>
          </div>
        </div>
      </div>
    );
  }

  const totalCount = rows.length;

  return (
    <StickyTable className={className} viewportClassName="max-h-[calc(100vh-13rem)]">
      <thead>
        <tr className="border-b text-xs">
          <StickyTableHeaderCell
            stickyLeft
            className={cn(agentColumnClass, "text-left")}
          >
            代理人
          </StickyTableHeaderCell>
          {columns.map((column) => (
            <StickyTableHeaderCell
              key={column.key}
              className={cn(column.className)}
            >
              {column.label}
            </StickyTableHeaderCell>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.id}
            className="group border-b last:border-b-0 hover:bg-muted transition-colors text-xs"
          >
            <StickyTableBodyCell
              stickyLeft
              className={cn(
                agentColumnClass,
                "z-20 border-r bg-background px-3 py-2 align-middle group-hover:bg-muted",
              )}
            >
              <div>
                <div className="font-medium text-foreground">
                  {row.agentName || "-"}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {row.agentCode || "-"}
                </div>
              </div>
            </StickyTableBodyCell>
            {columns.map((column) => (
              <StickyTableBodyCell
                key={column.key}
                className={cn("tabular-nums", column.className)}
              >
                {column.render(row)}
              </StickyTableBodyCell>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className="text-xs">
          <StickyTableFooterCell
            stickyLeft
            className={cn(
              agentColumnClass,
              "px-3 py-2 font-medium",
            )}
          >
            共 {totalCount} 条
          </StickyTableFooterCell>
          {columns.map((column) => (
            <StickyTableFooterCell
              key={column.key}
              className={cn("px-3 py-2 tabular-nums", column.className)}
            >
              {renderColumnSummary(column, rows)}
            </StickyTableFooterCell>
          ))}
        </tr>
      </tfoot>
    </StickyTable>
  );
}
