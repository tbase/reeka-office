import { startTransition, useEffect, useState } from "react"

import { getFilename } from "@/lib/path"
import { toCsv } from "@/lib/csv"
import { fetchSalesMonth, parseSalesMonthCsv, type SalesMonthRow } from "@/lib/pru"
import { type StoredWorkdirState } from "@/lib/workdir"
import {
  buildSalesMonthRelativePath,
  loadLatestSalesMonthCacheFile,
  loadSalesMonthCacheFileForMonth,
  salesMonthFileExists,
  writeSalesMonthFile,
} from "@/sales-month/lib/sales-month-storage"
import { buildSalesCacheDebugInfo, getMonthFromSalesCachePath } from "@/sales-month/lib/sales-month-cache"
import { serializeSalesMonthRow } from "@/sales-month/lib/sales-month-format"

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
        return
      }

      if (!month) {
        clearPreview()
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

        const parsedRows = parseSalesMonthCsv(cachedFile.content)
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
      const csv = toCsv(result.rows.map(serializeSalesMonthRow))

      await writeSalesMonthFile(nextOutputPath, csv)

      startTransition(() => {
        setRows(result.rows)
        setCacheRows(result.rows)
      })
      setCacheSourcePath(nextOutputPath)
      setStage(`抓取完成，共 ${result.rows.length} 条`)
    } catch (fetchError) {
      setStage("")
      setError(fetchError instanceof Error ? fetchError.message : "抓取失败")
    }
  }

  return {
    month,
    rows,
    stage,
    error,
    busy: Boolean(stage && !stage.startsWith("抓取完成")),
    previewMeta: cacheSourcePath ? getFilename(cacheSourcePath) : "",
    setMonth,
    fetchAction,
  }
}

export { useSalesMonthPanel }
