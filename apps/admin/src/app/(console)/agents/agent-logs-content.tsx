import type { AgentLogItem } from "@reeka-office/domain-agent"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatDateTime } from "@/lib/datetime"

import { AgentLogsFilterForm } from "./agent-logs-filter-form"
import type { AgentLogsSearchParams } from "./search-params"

const QUALIFICATION_FIELDS = new Set([
  "qualifiedGap",
  "isQualifiedNextMonth",
  "qualifiedGapNextMonth",
])

function formatPeriod(log: AgentLogItem) {
  if (!log.periodYear || !log.periodMonth) {
    return null
  }

  return `${log.periodYear}-${String(log.periodMonth).padStart(2, "0")}`
}

function formatValue(value: AgentLogItem["changes"][number]["before"]) {
  if (value == null) {
    return "空"
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "空数组"
  }

  if (typeof value === "boolean") {
    return value ? "true" : "false"
  }

  return String(value)
}

function formatApmNumericValue(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value / 100)
}

function formatChangeValue(
  log: AgentLogItem,
  value: AgentLogItem["changes"][number]["before"],
) {
  return log.category === "apm" && typeof value === "number"
    ? formatApmNumericValue(value)
    : formatValue(value)
}

function isQualificationLog(log: AgentLogItem) {
  return log.source === "RecalculateApmQualificationCommand"
    || log.changes.some((change) => QUALIFICATION_FIELDS.has(change.field))
}

function buildSummary(log: AgentLogItem) {
  const period = formatPeriod(log)
  const periodLabel = period ? `${period.replace("-", "/")} ` : ""

  if (log.category === "profile") {
    if (log.action === "created") {
      return "主档创建"
    }

    if (log.action === "deleted") {
      return "主档删除"
    }

    if (log.action === "restored") {
      return "主档恢复"
    }

    return "主档更新"
  }

  if (log.action === "created") {
    return `${periodLabel}月度数据新增`
  }

  if (isQualificationLog(log)) {
    return `${periodLabel}合资格更新`
  }

  return `${periodLabel}月度数据更新`
}

function AgentLogsList({ logs }: { logs: AgentLogItem[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-sm">
        当前筛选条件下暂无日志。
      </div>
    )
  }

  return (
    <Accordion className="divide-y rounded-lg border">
      {logs.map((log) => {
        const summary = buildSummary(log)

        return (
          <AccordionItem
            key={log.id}
            value={String(log.id)}
            className="border-0 px-4"
          >
            <AccordionTrigger className="items-start py-3 hover:no-underline">
              <div className="flex min-w-0 w-full flex-1 flex-col gap-1.5">
                <div className="min-w-0 truncate text-sm font-medium">
                  {summary}
                </div>
                <div className="text-muted-foreground text-xs">
                  <span className="min-w-0 truncate">
                    {formatDateTime(log.createdAt, {
                      dateSeparator: "/",
                    })}
                  </span>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              {log.changes.length > 0 ? (
                <div className="-mx-4 divide-y border-t">
                  {log.changes.map((change, index) => (
                    <div
                      key={`${log.id}:${change.field}:${index}`}
                      className="flex items-center gap-3 px-4 py-2 text-xs"
                    >
                      <div className="min-w-0 shrink font-medium break-all">
                        {change.field}
                      </div>
                      <div className="text-muted-foreground ml-auto min-w-0 flex-1 break-all text-right">
                        {formatChangeValue(log, change.before)}
                        <span className="text-primary px-1">→</span>
                        {formatChangeValue(log, change.after)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted-foreground text-sm">
                  无字段 diff。
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

interface AgentLogsContentProps {
  filters: AgentLogsSearchParams
  logs: AgentLogItem[]
  scrollable?: boolean
}

export function AgentLogsContent({
  filters,
  logs,
  scrollable = false,
}: AgentLogsContentProps) {
  const content = <AgentLogsList logs={logs} />

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <AgentLogsFilterForm {...filters} />

      {scrollable ? (
        <ScrollArea className="min-h-0 flex-1">
          {content}
        </ScrollArea>
      ) : (
        content
      )}
    </div>
  )
}
