"use client"

import type { AgentLogItem } from "@reeka-office/domain-agent"
import { HistoryIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface AgentLogsSheetProps {
  agentCode: string
  agentName: string
  logs: AgentLogItem[]
}

function formatDateTime(value: Date | string) {
  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
  })
}

function formatPeriod(log: AgentLogItem) {
  if (!log.periodYear || !log.periodMonth) {
    return null
  }

  return `${log.periodYear}-${String(log.periodMonth).padStart(2, "0")}`
}

function getActionLabel(action: AgentLogItem["action"]) {
  switch (action) {
    case "created":
      return "新增"
    case "updated":
      return "更新"
    case "deleted":
      return "删除"
    case "restored":
      return "恢复"
    default:
      return action
  }
}

function getActionVariant(action: AgentLogItem["action"]) {
  switch (action) {
    case "created":
    case "restored":
      return "secondary" as const
    case "deleted":
      return "destructive" as const
    default:
      return "outline" as const
  }
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

export function AgentLogsSheet({
  agentCode,
  agentName,
  logs,
}: AgentLogsSheetProps) {
  return (
    <Sheet>
      <SheetTrigger
        render={(
          <Button variant="outline" size="sm">
            <HistoryIcon />
            查看日志
          </Button>
        )}
      />
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{agentName} 的日志</SheetTitle>
          <SheetDescription>
            {agentCode} · 共 {logs.length} 条
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="min-h-0 flex-1 px-4 pb-4">
          {logs.length === 0 ? (
            <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-sm">
              暂无日志。
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const period = formatPeriod(log)

                return (
                  <div
                    key={log.id}
                    className="space-y-3 rounded-xl border p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{log.category}</Badge>
                      <Badge variant={getActionVariant(log.action)}>
                        {getActionLabel(log.action)}
                      </Badge>
                      {period ? <Badge variant="outline">{period}</Badge> : null}
                      <Badge variant="outline">{log.source}</Badge>
                    </div>

                    <div className="text-muted-foreground text-xs">
                      {formatDateTime(log.createdAt)}
                    </div>

                    {log.changes.length > 0 ? (
                      <div className="space-y-2">
                        {log.changes.map((change, index) => (
                          <div
                            key={`${log.id}:${change.field}:${index}`}
                            className="bg-muted/30 rounded-lg border px-3 py-2 text-sm"
                          >
                            <div className="font-medium">{change.field}</div>
                            <div className="text-muted-foreground mt-1 grid gap-1">
                              <div>变更前：{formatValue(change.before)}</div>
                              <div>变更后：{formatValue(change.after)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-muted-foreground text-sm">
                        无字段 diff。
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
