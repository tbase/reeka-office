import { startTransition, useEffect, useState } from "react"

import { getFilename } from "@/lib/path"
import { toCsv } from "@/lib/csv"
import { fetchSalesMonth, parseSalesMonthCsv, type SalesMonthRow } from "@/lib/pru"
import { type StoredWorkdirState } from "@/lib/workdir"
import {
  buildSalesMonthRelativePath,
  loadLatestSalesMonthCacheFile,
  loadLatestSalesMonthFileForExactMonth,
  loadSalesMonthFile,
  loadSalesMonthCacheFileForMonth,
  listSalesMonthFilesForMonth,
  type SalesMonthFileOption,
  salesMonthFileExists,
  writeSalesMonthFile,
} from "@/sales-month/lib/sales-month-storage"
import { buildSalesCacheDebugInfo, getMonthFromSalesCachePath } from "@/sales-month/lib/sales-month-cache"
import {
  buildSalesMonthDiff,
  hasSameSalesMonthRows,
  type SalesMonthDiffRow,
  type SalesMonthDiffSummary,
} from "@/sales-month/lib/sales-month-diff"
import { serializeSalesMonthRow, sortSalesMonthRows } from "@/sales-month/lib/sales-month-format"

const EMPTY_DIFF_SUMMARY: SalesMonthDiffSummary = {
  added: 0,
  modified: 0,
  removed: 0,
}

function useSalesMonthPanel({
  agentCode,
  workdirState,
}: {
  agentCode: string
  workdirState: StoredWorkdirState
}) {
  const [month, setMonth] = useState("")
  const [rows, setRows] = useState<SalesMonthRow[]>([])
  const [cacheRows, setCacheRows] = useState<SalesMonthRow[]>([])
  const [cacheSourcePath, setCacheSourcePath] = useState("")
  const [monthFiles, setMonthFiles] = useState<SalesMonthFileOption[]>([])
  const [baseFilePath, setBaseFilePath] = useState("")
  const [compareFilePath, setCompareFilePath] = useState("")
  const [compareMode, setCompareMode] = useState(false)
  const [compareBusy, setCompareBusy] = useState(false)
  const [diffRows, setDiffRows] = useState<SalesMonthDiffRow[]>([])
  const [diffSummary, setDiffSummary] = useState<SalesMonthDiffSummary>(EMPTY_DIFF_SUMMARY)
  const [stage, setStage] = useState("")
  const [error, setError] = useState("")
  const [diffError, setDiffError] = useState("")

  function resetDiffResult() {
    setDiffRows([])
    setDiffSummary(EMPTY_DIFF_SUMMARY)
    setDiffError("")
  }

  function resetDiffState() {
    setMonthFiles([])
    setBaseFilePath("")
    setCompareFilePath("")
    setCompareMode(false)
    setCompareBusy(false)
    resetDiffResult()
  }

  function resolveDiffSelection(
    options: SalesMonthFileOption[],
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

  async function refreshMonthFiles(
    targetMonth: string,
    preferredSelection?: {
      basePath?: string
      comparePath?: string
    },
  ) {
    if (!targetMonth || workdirState.permission !== "granted") {
      resetDiffState()
      return
    }

    try {
      const options = await listSalesMonthFilesForMonth(targetMonth)
      const selection = resolveDiffSelection(
        options,
        preferredSelection?.basePath ?? baseFilePath,
        preferredSelection?.comparePath ?? compareFilePath,
      )

      setMonthFiles(options)
      setBaseFilePath(selection.basePath)
      setCompareFilePath(selection.comparePath)
      resetDiffResult()
    } catch (loadError) {
      resetDiffState()
      setDiffError(loadError instanceof Error ? loadError.message : "读取月汇总文件列表失败")
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

  function closeCompareAction() {
    setCompareMode(false)
    resetDiffResult()
  }

  function openCompareAction() {
    setCompareMode(true)
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

    async function loadLatestMonth() {
      if (workdirState.permission !== "granted" || month) {
        return
      }

      try {
        const cachedFile = await loadLatestSalesMonthCacheFile()

        if (cancelled) {
          return
        }

        if (!cachedFile) {
          clearPreview()
          return
        }

        const cachedMonth = getMonthFromSalesCachePath(cachedFile.path)

        if (!cachedMonth) {
          throw new Error("最新缓存文件路径格式不正确")
        }

        startTransition(() => {
          setMonth(cachedMonth)
        })
        setError("")
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "读取缓存失败")
        }
      }
    }

    void loadLatestMonth()

    return () => {
      cancelled = true
    }
  }, [month, workdirState.name, workdirState.permission])

  useEffect(() => {
    let cancelled = false

    async function loadPreviewByMonth() {
      if (workdirState.permission !== "granted") {
        resetDiffState()
        return
      }

      if (!month) {
        clearPreview()
        resetDiffState()
        return
      }

      try {
        const cachedFile = await loadSalesMonthCacheFileForMonth(month)

        if (cancelled) {
          return
        }

        if (!cachedFile) {
          clearPreview()
          setError("")
          return
        }

        const parsedRows = sortSalesMonthRows(parseSalesMonthCsv(cachedFile.content))
        const debugInfo = buildSalesCacheDebugInfo(cachedFile.path, cachedFile.content, parsedRows)

        console.info("[sales-month] cache debug", debugInfo)

        if (parsedRows.length === 0) {
          const headerText = debugInfo.headers.join("|") || "(empty)"
          throw new Error(
            `目标月份缓存解析为空: file=${cachedFile.path}; headers=${headerText}; rawRows=${debugInfo.rawRowCount}; parsedRows=${debugInfo.parsedRowCount}; firstMonth=${debugInfo.firstRawRow.MONTH}; firstAgent=${debugInfo.firstRawRow.AGENT_CODE}`,
          )
        }

        startTransition(() => {
          setRows(parsedRows)
          setCacheRows(parsedRows)
        })
        setCacheSourcePath(cachedFile.path)
        setError("")
      } catch (loadError) {
        if (!cancelled) {
          clearPreview()
          setError(loadError instanceof Error ? loadError.message : "读取缓存失败")
        }
      }
    }

    void loadPreviewByMonth()

    return () => {
      cancelled = true
    }
  }, [month, workdirState.permission])

  useEffect(() => {
    let cancelled = false

    async function loadMonthFiles() {
      if (!month || workdirState.permission !== "granted") {
        resetDiffState()
        return
      }

      try {
        const options = await listSalesMonthFilesForMonth(month)

        if (cancelled) {
          return
        }

        const selection = resolveDiffSelection(options)

        setMonthFiles(options)
        setBaseFilePath(selection.basePath)
        setCompareFilePath(selection.comparePath)
        setCompareMode(false)
        resetDiffResult()
      } catch (loadError) {
        if (!cancelled) {
          resetDiffState()
          setDiffError(loadError instanceof Error ? loadError.message : "读取月汇总文件列表失败")
        }
      }
    }

    void loadMonthFiles()

    return () => {
      cancelled = true
    }
  }, [month, workdirState.permission])

  useEffect(() => {
    let cancelled = false

    async function loadDiffRows() {
      if (!compareMode) {
        return
      }

      if (monthFiles.length < 2) {
        resetDiffResult()
        setDiffError("同月落地文件不足 2 份，暂时无法对比")
        return
      }

      if (!baseFilePath || !compareFilePath || baseFilePath === compareFilePath) {
        resetDiffResult()
        setDiffError("请选择两份不同的同月文件")
        return
      }

      setCompareBusy(true)
      setDiffError("")

      try {
        const [baseFile, compareFile] = await Promise.all([
          loadSalesMonthFile(baseFilePath),
          loadSalesMonthFile(compareFilePath),
        ])

        if (cancelled) {
          return
        }

        const baseRows = sortSalesMonthRows(parseSalesMonthCsv(baseFile.content))
        const compareRows = sortSalesMonthRows(parseSalesMonthCsv(compareFile.content))
        const diff = buildSalesMonthDiff(baseRows, compareRows)

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
  }, [baseFilePath, compareFilePath, compareMode, monthFiles.length])

  async function fetchAction() {
    if (!agentCode) {
      setError("请先填写并保存代理人编号")
      return
    }

    if (!month) {
      setError("请选择月份")
      return
    }

    if (workdirState.permission !== "granted") {
      setError("请先在设置中连接可写的工作目录")
      return
    }

    const nextOutputPath = buildSalesMonthRelativePath(month)

    if (await salesMonthFileExists(nextOutputPath)) {
      setError("该目标月份在当前小时已拉取，禁止重复拉取")
      return
    }

    setError("")
    setStage("准备抓取...")

    try {
      const result = await fetchSalesMonth(agentCode, month, {
        onProgress: setStage,
        cacheRows,
        cacheSourcePath,
      })
      const sortedRows = sortSalesMonthRows(result.rows)
      const latestMonthFile = await loadLatestSalesMonthFileForExactMonth(month)
      const latestMonthRows = latestMonthFile
        ? sortSalesMonthRows(parseSalesMonthCsv(latestMonthFile.content))
        : []

      if (latestMonthFile && hasSameSalesMonthRows(latestMonthRows, sortedRows)) {
        setCacheSourcePath(latestMonthFile.path)
        setCacheRows(sortedRows)
        startTransition(() => {
          setRows(sortedRows)
        })
        await refreshMonthFiles(month, {
          basePath: latestMonthFile.path,
          comparePath: compareFilePath,
        })
        setStage("抓取完成，数据无变化，未生成新文件")
        return
      }

      const csv = toCsv(sortedRows.map(serializeSalesMonthRow))

      await writeSalesMonthFile(nextOutputPath, csv)

      startTransition(() => {
        setRows(sortedRows)
        setCacheRows(sortedRows)
      })
      setCacheSourcePath(nextOutputPath)
      await refreshMonthFiles(month, {
        basePath: nextOutputPath,
        comparePath: latestMonthFile?.path ?? compareFilePath,
      })
      setStage(`抓取完成，共 ${result.rows.length} 条`)
    } catch (fetchError) {
      setStage("")
      setError(fetchError instanceof Error ? fetchError.message : "抓取失败")
    }
  }

  return {
    month,
    rows,
    monthFiles,
    baseFilePath,
    compareFilePath,
    compareMode,
    compareBusy,
    diffRows,
    diffSummary,
    diffError,
    baseFileLabel: monthFiles.find((option) => option.path === baseFilePath)?.label ?? "",
    compareFileLabel: monthFiles.find((option) => option.path === compareFilePath)?.label ?? "",
    stage,
    error,
    busy: Boolean(stage && !stage.startsWith("抓取完成")),
    previewMeta:
      compareMode
        ? `${
            monthFiles.find((option) => option.path === baseFilePath)?.label ?? getFilename(baseFilePath)
          } vs ${
            monthFiles.find((option) => option.path === compareFilePath)?.label ?? getFilename(compareFilePath)
          }`
        : (cacheSourcePath ? getFilename(cacheSourcePath) : ""),
    canEnterCompare: monthFiles.length >= 2,
    setMonth,
    setBaseFilePath: updateBaseFilePath,
    setCompareFilePath: updateCompareFilePath,
    openCompareAction,
    closeCompareAction,
    fetchAction,
  }
}

export { useSalesMonthPanel }
