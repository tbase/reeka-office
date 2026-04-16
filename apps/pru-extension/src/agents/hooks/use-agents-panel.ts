import { startTransition, useEffect, useState } from "react"

import { AGENT_COLUMNS } from "@/agents/lib/agent-columns"
import {
  buildAgentDiff,
  buildAgentDiffStats,
  hasAgentDiff,
  type AgentDiffRow,
  type AgentDiffSummary,
} from "@/agents/lib/agent-diff"
import {
  agentsFileExists,
  buildAgentsRelativePath,
  listLatestAgentFiles,
  loadAgentsFile,
  loadLatestAgentsCacheFile,
  type AgentFileOption,
  writeAgentsFile,
} from "@/agents/lib/agents-storage"
import { getFilename } from "@/lib/path"
import { toCsv } from "@/lib/csv"
import { fetchAgents, parseAgentsCsv, type AgentRow } from "@/lib/pru"
import { type StoredWorkdirState } from "@/lib/workdir"

const EMPTY_AGENT_DIFF_SUMMARY: AgentDiffSummary = {
  added: 0,
  modified: 0,
  removed: 0,
}

function logModifiedAgentFields(diffRows: AgentDiffRow[]) {
  for (const row of diffRows) {
    if (row.changeType !== "modified") {
      continue
    }

    console.groupCollapsed(
      `[PRU agent diff] M ${row.row.agent_code}: ${row.changedFields
        .map((field) => field.key)
        .join(", ")}`,
    )
    console.table(
      row.changedFields.map((field) => ({
        field: field.key,
        previous: field.previousValue,
        current: field.nextValue,
      })),
    )
    console.groupEnd()
  }
}

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
  const [agentFiles, setAgentFiles] = useState<AgentFileOption[]>([])
  const [baseFilePath, setBaseFilePath] = useState("")
  const [compareFilePath, setCompareFilePath] = useState("")
  const [compareMode, setCompareMode] = useState(false)
  const [compareBusy, setCompareBusy] = useState(false)
  const [diffRows, setDiffRows] = useState<AgentDiffRow[]>([])
  const [diffSummary, setDiffSummary] = useState<AgentDiffSummary>(EMPTY_AGENT_DIFF_SUMMARY)
  const [stage, setStage] = useState("")
  const [error, setError] = useState("")
  const [diffError, setDiffError] = useState("")

  function sortAgentRows(sourceRows: AgentRow[]) {
    return [...sourceRows].sort((left, right) => left.agent_code.localeCompare(right.agent_code))
  }

  function resetDiffResult() {
    setDiffRows([])
    setDiffSummary(EMPTY_AGENT_DIFF_SUMMARY)
    setDiffError("")
  }

  function resetDiffState() {
    setAgentFiles([])
    setBaseFilePath("")
    setCompareFilePath("")
    setCompareMode(false)
    setCompareBusy(false)
    resetDiffResult()
  }

  function resolveDiffSelection(
    options: AgentFileOption[],
    preferredBasePath = "",
    preferredComparePath = "",
  ) {
    const optionPaths = new Set(options.map((option) => option.path))
    const defaultBasePath = options[2]?.path ?? options[1]?.path ?? options[0]?.path ?? ""
    const defaultComparePath = options[0]?.path ?? ""
    const basePath = optionPaths.has(preferredBasePath) ? preferredBasePath : defaultBasePath
    const comparePath =
      preferredComparePath &&
      preferredComparePath !== basePath &&
      optionPaths.has(preferredComparePath)
        ? preferredComparePath
        : (defaultComparePath !== basePath
            ? defaultComparePath
            : (options.find((option) => option.path !== basePath)?.path ?? ""))

    return {
      basePath,
      comparePath,
    }
  }

  async function refreshAgentFiles(
    preferredSelection?: {
      basePath?: string
      comparePath?: string
    },
  ) {
    if (workdirState.permission !== "granted") {
      resetDiffState()
      return
    }

    try {
      const options = await listLatestAgentFiles(10)
      const selection = resolveDiffSelection(
        options,
        preferredSelection?.basePath ?? baseFilePath,
        preferredSelection?.comparePath ?? compareFilePath,
      )

      setAgentFiles(options)
      setBaseFilePath(selection.basePath)
      setCompareFilePath(selection.comparePath)
      resetDiffResult()
    } catch (loadError) {
      resetDiffState()
      setDiffError(loadError instanceof Error ? loadError.message : "读取代理人文件列表失败")
    }
  }

  function updateBaseFilePath(path: string) {
    setBaseFilePath(path)
    resetDiffResult()
  }

  function updateCompareFilePath(path: string) {
    setCompareFilePath(path)
    resetDiffResult()
  }

  function openCompareAction() {
    setCompareMode(true)
    resetDiffResult()
  }

  function closeCompareAction() {
    setCompareMode(false)
    resetDiffResult()
  }

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
        resetDiffState()
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

        const parsedRows = sortAgentRows(parseAgentsCsv(cachedFile.content))

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

  useEffect(() => {
    let cancelled = false

    async function loadAgentFiles() {
      if (workdirState.permission !== "granted") {
        resetDiffState()
        return
      }

      try {
        const options = await listLatestAgentFiles(10)

        if (cancelled) {
          return
        }

        const selection = resolveDiffSelection(options)

        setAgentFiles(options)
        setBaseFilePath(selection.basePath)
        setCompareFilePath(selection.comparePath)
        setCompareMode(false)
        resetDiffResult()
      } catch (loadError) {
        if (!cancelled) {
          resetDiffState()
          setDiffError(loadError instanceof Error ? loadError.message : "读取代理人文件列表失败")
        }
      }
    }

    void loadAgentFiles()

    return () => {
      cancelled = true
    }
  }, [workdirState.name, workdirState.permission])

  useEffect(() => {
    let cancelled = false

    async function loadDiffRows() {
      if (!compareMode) {
        return
      }

      if (agentFiles.length < 2) {
        resetDiffResult()
        setDiffError("最新 10 份代理人文件中不足 2 份，暂时无法对比")
        return
      }

      if (!baseFilePath || !compareFilePath || baseFilePath === compareFilePath) {
        resetDiffResult()
        setDiffError("请选择两份不同的代理人文件")
        return
      }

      setCompareBusy(true)
      setDiffError("")

      try {
        const [baseFile, compareFile] = await Promise.all([
          loadAgentsFile(baseFilePath),
          loadAgentsFile(compareFilePath),
        ])

        if (cancelled) {
          return
        }

        const baseRows = sortAgentRows(parseAgentsCsv(baseFile.content))
        const compareRows = sortAgentRows(parseAgentsCsv(compareFile.content))
        const diff = buildAgentDiff(baseRows, compareRows)

        logModifiedAgentFields(diff.rows)
        setDiffRows(diff.rows)
        setDiffSummary(diff.summary)
      } catch (loadError) {
        if (!cancelled) {
          resetDiffResult()
          setDiffError(loadError instanceof Error ? loadError.message : "读取对比文件失败")
        }
      } finally {
        if (!cancelled) {
          setCompareBusy(false)
        }
      }
    }

    void loadDiffRows()

    return () => {
      cancelled = true
    }
  }, [agentFiles.length, baseFilePath, compareFilePath, compareMode])

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
      const sortedRows = sortAgentRows(result)
      const diffStats = buildAgentDiffStats(cacheRows, sortedRows)

      if (!hasAgentDiff(diffStats)) {
        startTransition(() => {
          setRows(sortedRows)
        })
        await refreshAgentFiles()
        setStage("抓取完成，无新增、修改或删除，未生成新文件")
        return
      }

      const csv = toCsv(sortedRows, AGENT_COLUMNS)

      await writeAgentsFile(nextOutputPath, csv)

      setCacheSourcePath(nextOutputPath)
      setCacheRows(sortedRows)
      startTransition(() => {
        setRows(sortedRows)
      })
      await refreshAgentFiles({
        basePath: agentFiles[0]?.path ?? baseFilePath,
        comparePath: nextOutputPath,
      })
      setStage(
        `抓取完成，共 ${sortedRows.length} 条；新增 ${diffStats.created} 条，修改 ${diffStats.updated} 条，删除 ${diffStats.deleted} 条`,
      )
    } catch (fetchError) {
      setStage("")
      setError(fetchError instanceof Error ? fetchError.message : "抓取失败")
    }
  }

  return {
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
    busy: Boolean(stage && !stage.startsWith("抓取完成")),
    previewMeta: compareMode
      ? `${
          agentFiles.find((option) => option.path === baseFilePath)?.label ?? ""
        } vs ${
          agentFiles.find((option) => option.path === compareFilePath)?.label ?? ""
        }`
      : (cacheSourcePath ? getFilename(cacheSourcePath) : ""),
    canEnterCompare: agentFiles.length >= 2,
    setBaseFilePath: updateBaseFilePath,
    setCompareFilePath: updateCompareFilePath,
    openCompareAction,
    closeCompareAction,
    fetchAction,
  }
}

export { useAgentsPanel }
