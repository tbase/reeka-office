"use client";

import type { ApmYearlyStatItem } from "@reeka-office/domain-performance";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";

import {
  formatCount,
  formatMoneyInWan,
  formatMonthLabel,
} from "./format";

interface PerformanceYearlyChartProps {
  data: readonly ApmYearlyStatItem[];
}

type SeriesKey = "nsc" | "nscSum" | "netCase" | "netCaseSum";
type ChartKey = "nsc" | "netCase";

type SeriesConfig = {
  label: string;
  color: string;
};

type MetricChartConfig = {
  title: string;
  barKey: SeriesKey;
  lineKey: SeriesKey;
  formatValue: (value: number) => string;
  series: Record<SeriesKey, SeriesConfig>;
};

const chartConfigs: Record<ChartKey, MetricChartConfig> = {
  nsc: {
    title: "NSC",
    barKey: "nsc",
    lineKey: "nscSum",
    formatValue: formatMoneyInWan,
    series: {
      nsc: {
        label: "月度 NSC",
        color: "#e11d48",
      },
      nscSum: {
        label: "累计 NSC SUM",
        color: "#fb7185",
      },
      netCase: {
        label: "",
        color: "",
      },
      netCaseSum: {
        label: "",
        color: "",
      },
    },
  },
  netCase: {
    title: "CASE",
    barKey: "netCase",
    lineKey: "netCaseSum",
    formatValue: formatCount,
    series: {
      nsc: {
        label: "",
        color: "",
      },
      nscSum: {
        label: "",
        color: "",
      },
      netCase: {
        label: "月度 CASE",
        color: "#dc2626",
      },
      netCaseSum: {
        label: "累计 CASE SUM",
        color: "#f87171",
      },
    },
  },
};

const chartKeys: ChartKey[] = ["nsc", "netCase"];

function normalizeChartData(data: readonly ApmYearlyStatItem[]) {
  const byMonth = new Map(data.map((item) => [item.month, item]));

  return Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const item = byMonth.get(month);

    return {
      month,
      monthLabel: formatMonthLabel(month),
      nsc: item?.nsc ?? 0,
      nscSum: item?.nscSum ?? 0,
      netCase: item?.netCase ?? 0,
      netCaseSum: item?.netCaseSum ?? 0,
    };
  });
}

interface PerformanceMetricTooltipProps {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string | number;
    fill?: string;
    value?: number | string;
  }>;
  label?: string | number;
  chartKey: ChartKey;
}

function PerformanceMetricTooltip({
  active,
  payload,
  label,
  chartKey,
}: PerformanceMetricTooltipProps) {
  if (!active || !payload?.length) {
    return null;
  }

  const config = chartConfigs[chartKey];

  return (
    <div className="grid min-w-44 gap-1.5 rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl">
      <div className="font-medium">{label}</div>
      <div className="grid gap-1">
        {payload.map((item) => {
          const dataKey = String(item.dataKey ?? "") as SeriesKey;
          const series = config.series[dataKey];
          const value = Number(item.value ?? 0);

          return (
            <div
              key={dataKey}
              className="flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor:
                      item.color ??
                      item.fill ??
                      series?.color ??
                      "var(--foreground)",
                  }}
                />
                <span className="text-muted-foreground">
                  {series?.label ?? dataKey}
                </span>
              </div>
              <span className="font-mono tabular-nums text-foreground">
                {config.formatValue(value)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PerformanceMetricChart({
  chartKey,
  data,
}: {
  chartKey: ChartKey;
  data: readonly ApmYearlyStatItem[];
}) {
  const config = chartConfigs[chartKey];
  const chartData = normalizeChartData(data);
  const chartSeries = {
    [config.barKey]: config.series[config.barKey],
    [config.lineKey]: config.series[config.lineKey],
  };

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{config.title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <ChartContainer config={chartSeries} className="h-[320px] w-full">
          <ComposedChart
            data={chartData}
            margin={{ top: 8, right: 12, left: 12, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="monthLabel"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              yAxisId="left"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={72}
              tickFormatter={(value) => config.formatValue(Number(value))}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={72}
              tickFormatter={(value) => config.formatValue(Number(value))}
            />
            <ChartTooltip
              content={<PerformanceMetricTooltip chartKey={chartKey} />}
            />
            <Bar
              yAxisId="left"
              dataKey={config.barKey}
              name={config.series[config.barKey].label}
              fill={`var(--color-${config.barKey})`}
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey={config.lineKey}
              name={config.series[config.lineKey].label}
              stroke={`var(--color-${config.lineKey})`}
              strokeWidth={2}
              dot={{ r: 3, fill: `var(--color-${config.lineKey})` }}
              activeDot={{ r: 5 }}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function PerformanceYearlyChart({ data }: PerformanceYearlyChartProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {chartKeys.map((chartKey) => (
        <PerformanceMetricChart
          key={chartKey}
          chartKey={chartKey}
          data={data}
        />
      ))}
    </div>
  );
}
