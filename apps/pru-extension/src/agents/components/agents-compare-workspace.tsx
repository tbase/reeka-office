import { AgentsDiffTable } from "@/agents/components/agents-diff-table"
import { type AgentDiffRow, type AgentDiffSummary } from "@/agents/lib/agent-diff"
import { type AgentFileOption } from "@/agents/lib/agents-storage"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function AgentsCompareWorkspace({
  agentFiles,
  diffRows,
  diffSummary,
  diffError,
}: {
  agentFiles: AgentFileOption[]
  diffRows: AgentDiffRow[]
  diffSummary: AgentDiffSummary
  diffError: string
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {agentFiles.length < 2 ? (
        <Alert className="m-4 border-stone-200 bg-white/90">
          <AlertTitle>暂无可比较文件</AlertTitle>
          <AlertDescription>最新 10 份代理人文件中不足 2 份。</AlertDescription>
        </Alert>
      ) : diffError ? (
        <Alert className="m-4 border-red-200 bg-red-50/90">
          <AlertTitle>对比失败</AlertTitle>
          <AlertDescription>{diffError}</AlertDescription>
        </Alert>
      ) : (
        <div className="min-h-0 flex-1">
          <AgentsDiffTable rows={diffRows} />
        </div>
      )}
      <div className="border-t border-border/70 px-4 py-2 text-xs text-muted-foreground">
        A {diffSummary.added} / M {diffSummary.modified} / D {diffSummary.removed}
      </div>
    </div>
  )
}

export { AgentsCompareWorkspace }
