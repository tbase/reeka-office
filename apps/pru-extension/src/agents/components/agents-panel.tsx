import { AgentsCompareWorkspace } from "@/agents/components/agents-compare-workspace"
import { useAgentsPanel } from "@/agents/hooks/use-agents-panel"
import { AGENT_COLUMNS } from "@/agents/lib/agent-columns"
import { PreviewTable } from "@/components/preview-table"
import { ResultPanel } from "@/components/result-panel"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { type StoredWorkdirState } from "@/lib/workdir"

function AgentsPanel({
  agentCode,
  workdirState,
}: {
  agentCode: string
  workdirState: StoredWorkdirState
}) {
  const {
    rows,
    agentFiles,
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
    setBaseFilePath,
    setCompareFilePath,
    openCompareAction,
    closeCompareAction,
    fetchAction,
  } = useAgentsPanel({
    agentCode,
    workdirState,
  })
  const agentFileItems = agentFiles.map((option) => ({
    value: option.path,
    label: option.label,
  }))

  return (
    <ResultPanel
      title="代理人信息"
      busy={busy}
      stage={stage}
      error={error}
      rowCount={compareMode ? diffRows.length : rows.length}
      fetchAction={compareMode ? undefined : fetchAction}
      previewMeta={previewMeta}
      controls={
        compareMode ? (
          <div className="grid w-full gap-3 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0">
              <Select
                items={agentFileItems}
                value={baseFilePath}
                onValueChange={(value) => setBaseFilePath(String(value ?? ""))}
                disabled={agentFiles.length < 2 || compareBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择基准文件" />
                </SelectTrigger>
                <SelectContent>
                  {agentFiles.map((option) => (
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
                items={agentFileItems}
                value={compareFilePath}
                onValueChange={(value) => setCompareFilePath(String(value ?? ""))}
                disabled={agentFiles.length < 2 || compareBusy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择当前文件" />
                </SelectTrigger>
                <SelectContent>
                  {agentFiles.map((option) => (
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
          <div className="flex w-full justify-end">
            {canEnterCompare ? (
              <Button variant="outline" onClick={openCompareAction}>
                进入对比
              </Button>
            ) : null}
          </div>
        )
      }
    >
      {compareMode ? (
        <AgentsCompareWorkspace
          agentFiles={agentFiles}
          diffRows={diffRows}
          diffSummary={diffSummary}
          diffError={diffError}
        />
      ) : (
        <PreviewTable columns={AGENT_COLUMNS} rows={rows} renderCell={(row, column) => row[column.key]} />
      )}
    </ResultPanel>
  )
}

export { AgentsPanel }
