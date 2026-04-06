import { startTransition, useEffect, useState } from "react"

import { AGENT_COLUMNS } from "@/agents/lib/agent-columns"
import { buildAgentDiffStats, hasAgentDiff } from "@/agents/lib/agent-diff"
import {
  agentsFileExists,
  buildAgentsRelativePath,
  loadLatestAgentsCacheFile,
  writeAgentsFile,
} from "@/agents/lib/agents-storage"
import { getFilename } from "@/lib/path"
import { toCsv } from "@/lib/csv"
import { fetchAgents, parseAgentsCsv, type AgentRow } from "@/lib/pru"
import { type StoredWorkdirState } from "@/lib/workdir"

function useAgentsPanel({
  agentCode,
  workdirState,
}: {
  agentCode: string
  workdirState: StoredWorkdirState
}) {
  const [rows, setRows] = useState<AgentRow[]>([])
  const [cacheRows, setCacheRows] = useState<AgentRow[]>([])
  const [cacheSourcePath, setCacheSourcePath] = useState("")
  const [stage, setStage] = useState("")
  const [error, setError] = useState("")

  function clearPreview() {
    setCacheSourcePath("")
    setCacheRows([])
    startTransition(() => {
      setRows([])
    })
  }

  useEffect(() => {
    let cancelled = false

    async function loadPreview() {
      if (workdirState.permission !== "granted") {
        clearPreview()
        return
      }

      try {
        const cachedFile = await loadLatestAgentsCacheFile()

        if (cancelled) {
          return
        }

        if (!cachedFile) {
          clearPreview()
          setError("")
          return
        }

        const parsedRows = parseAgentsCsv(cachedFile.content)

        setCacheSourcePath(cachedFile.path)
        setCacheRows(parsedRows)
        startTransition(() => {
          setRows(parsedRows)
        })
        setError("")
      } catch (loadError) {
        if (!cancelled) {
          clearPreview()
          setError(loadError instanceof Error ? loadError.message : "读取缓存失败")
        }
      }
    }

    void loadPreview()

    return () => {
      cancelled = true
    }
  }, [workdirState.name, workdirState.permission])

  async function fetchAction() {
    if (!agentCode) {
      setError("请先填写并保存代理人编号")
      return
    }

    if (workdirState.permission !== "granted") {
      setError("请先在设置中连接可写的工作目录")
      return
    }

    const nextOutputPath = buildAgentsRelativePath()

    if (await agentsFileExists(nextOutputPath)) {
      setError("当前小时代理人信息已拉取，禁止重复拉取")
      return
    }

    setError("")
    setStage("准备抓取...")

    try {
      const result = await fetchAgents(agentCode, {
        onProgress: setStage,
        cacheRows,
      })
      const diffStats = buildAgentDiffStats(cacheRows, result)

      if (!hasAgentDiff(diffStats)) {
        startTransition(() => {
          setRows(result)
        })
        setStage("抓取完成，无新增、修改或删除，未生成新文件")
        return
      }

      const csv = toCsv(result, AGENT_COLUMNS)

      await writeAgentsFile(nextOutputPath, csv)

      setCacheSourcePath(nextOutputPath)
      setCacheRows(result)
      startTransition(() => {
        setRows(result)
      })
      setStage(
        `抓取完成，共 ${result.length} 条；新增 ${diffStats.created} 条，修改 ${diffStats.updated} 条，删除 ${diffStats.deleted} 条`,
      )
    } catch (fetchError) {
      setStage("")
      setError(fetchError instanceof Error ? fetchError.message : "抓取失败")
    }
  }

  return {
    rows,
    stage,
    error,
    busy: Boolean(stage && !stage.startsWith("抓取完成")),
    previewMeta: cacheSourcePath ? getFilename(cacheSourcePath) : "",
    fetchAction,
  }
}

export { useAgentsPanel }
