import { useAgentsPanel } from "@/agents/hooks/use-agents-panel"
import { AGENT_COLUMNS } from "@/agents/lib/agent-columns"
import { PreviewTable } from "@/components/preview-table"
import { ResultPanel } from "@/components/result-panel"
import { type StoredWorkdirState } from "@/lib/workdir"

function AgentsPanel({
  agentCode,
  workdirState,
}: {
  agentCode: string
  workdirState: StoredWorkdirState
}) {
  const { rows, stage, error, busy, previewMeta, fetchAction } = useAgentsPanel({
    agentCode,
    workdirState,
  })

  return (
    <ResultPanel
      title="代理人信息"
      busy={busy}
      stage={stage}
      error={error}
      rowCount={rows.length}
      fetchAction={fetchAction}
      previewMeta={previewMeta}
    >
      <PreviewTable columns={AGENT_COLUMNS} rows={rows} renderCell={(row, column) => row[column.key]} />
    </ResultPanel>
  )
}

export { AgentsPanel }
