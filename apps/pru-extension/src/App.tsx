import { startTransition, type ReactNode, useEffect, useState } from "react"
import { Download, FolderOpen, LoaderCircle, RefreshCw, Settings2, Trash2, Users, WalletCards } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { loadSettings, saveSettings, type ExtensionSettings } from "@/lib/chrome"
import { downloadCsv, parseCsv, toCsv, type CsvColumn } from "@/lib/csv"
import {
  fetchAgents,
  fetchSalesMonth,
  parseSalesMonthCsv,
  toMonthInputValue,
  type AgentRow,
  type SalesMonthRow,
} from "@/lib/pru"
import {
  buildSalesMonthRelativePath,
  clearWorkdirHandle,
  loadLatestSalesMonthCacheFile,
  loadSalesMonthCacheFileForMonth,
  loadStoredWorkdirState,
  pickWorkdirHandle,
  salesMonthFileExists,
  saveWorkdirHandle,
  writeSalesMonthFile,
  type StoredWorkdirState,
} from "@/lib/workdir"

type TabKey = "agents" | "sales"
type TableColumn<T> = {
  key: keyof T
  label: string
  format?: (value: T[keyof T], row: T) => string | number
}

const DEFAULT_SETTINGS: ExtensionSettings = {
  agentCode: "",
  workdirName: "",
  workdirConnectedAt: "",
}

const EMPTY_WORKDIR_STATE: StoredWorkdirState = {
  name: "",
  permission: "missing",
  hasHandle: false,
}

const AGENT_COLUMNS: Array<CsvColumn<AgentRow> & { label: string }> = [
  { key: "agent_code", header: "agent_code", label: "代理编码" },
  { key: "pinyin", header: "pinyin", label: "拼音" },
  { key: "designation", header: "designation", label: "级别" },
  { key: "leader_code", header: "leader_code", label: "上级编码" },
  { key: "join_date", header: "join_date", label: "加入日期" },
  { key: "agency", header: "agency", label: "Agency" },
  { key: "division", header: "division", label: "Division" },
  { key: "financing_scheme", header: "financing_scheme", label: "融资方案" },
  { key: "financing_advance", header: "financing_advance", label: "融资预支" },
]

const SALES_TABLE_COLUMNS: TableColumn<SalesMonthRow>[] = [
  { key: "month", label: "MONTH" },
  { key: "agent_code", label: "AGENT CODE" },
  {
    key: "nsc",
    label: "NSC",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp",
    label: "AFYP",
    format: (value, row) => formatAssignedMoney(value as number, row.net_afyp_assigned),
  },
  {
    key: "nsc_hp",
    label: "NSC HP",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp_hp",
    label: "AFYP HP",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp_h",
    label: "AFYP H",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_case",
    label: "Case",
    format: (value, row) => formatAssignedMoney(value as number, row.net_case_assigned),
  },
  {
    key: "net_case_h",
    label: "CASE H",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "is_qualified",
    label: "QHC",
    format: (value, row) => formatAssignedCount(value as number, row.is_qualified_assigned),
  },
  {
    key: "nsc_sum",
    label: "NSC Sum",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp_sum",
    label: "AFYP SUM",
    format: (value, row) => formatAssignedMoney(value as number, row.net_afyp_assigned_sum),
  },
  {
    key: "nsc_hp_sum",
    label: "NSC HP SUM",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp_hp_sum",
    label: "AFYP HP SUM",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyp_h_sum",
    label: "AFYP H SUM",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_case_sum",
    label: "CASE SUM",
    format: (value, row) => formatAssignedMoney(value as number, row.net_case_assigned_sum),
  },
  {
    key: "net_case_h_sum",
    label: "CASE H SUM",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "net_afyc_sum",
    label: "AFYC SUM",
    format: (value) => formatMoney(value as number),
  },
  {
    key: "renewal_rate_team",
    label: "RENEWAL RATE TEAM",
    format: (value) => formatRate(value as number),
  },
]

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100)
}

function formatAssignedMoney(value: number, assigned: number) {
  const base = formatMoney(value)

  if (!assigned) {
    return base
  }

  return `${base} +${formatMoney(assigned)}`
}

function formatAssignedCount(value: number, assigned: number) {
  const base = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100)

  if (!assigned) {
    return base
  }

  return `${base} +${new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(assigned / 100)}`
}

function formatRate(value: number) {
  return `${(value / 100).toFixed(2)}%`
}

function serializeSalesMonthRow(row: SalesMonthRow) {
  return {
    month: row.month,
    year: row.year,
    agent_code: row.agent_code,
    pinyin: row.pinyin,
    net_afyp: row.net_afyp,
    net_afyp_assigned: row.net_afyp_assigned,
    net_case: row.net_case,
    net_case_assigned: row.net_case_assigned,
    nsc: row.nsc,
    is_qualified: row.is_qualified,
    is_qualified_assigned: row.is_qualified_assigned,
    net_afyp_sum: row.net_afyp_sum,
    net_afyp_assigned_sum: row.net_afyp_assigned_sum,
    net_case_sum: row.net_case_sum,
    net_case_assigned_sum: row.net_case_assigned_sum,
    nsc_sum: row.nsc_sum,
    net_afyc_sum: row.net_afyc_sum,
    nsc_hp: row.nsc_hp,
    nsc_hp_sum: row.nsc_hp_sum,
    net_afyp_hp: row.net_afyp_hp,
    net_afyp_hp_sum: row.net_afyp_hp_sum,
    net_afyp_h: row.net_afyp_h,
    net_afyp_h_sum: row.net_afyp_h_sum,
    net_case_h: row.net_case_h,
    net_case_h_sum: row.net_case_h_sum,
    renewal_rate_team: row.renewal_rate_team,
  }
}

function getTimestamp() {
  const now = new Date()
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ]

  return `${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}`
}

function getFilename(path: string) {
  return path.split("/").at(-1) ?? ""
}

function getMonthFromSalesCachePath(path: string) {
  const match = path.match(/^sales-month\/(\d{4})\/(\d{2})-\d{10}\.csv$/)

  if (!match) {
    return ""
  }

  const [, year, month] = match
  return `${year}-${month}`
}

function buildSalesCacheDebugInfo(path: string, content: string, parsedRows: SalesMonthRow[]) {
  const rawRows = parseCsv(content)
  const headers = Object.keys(rawRows[0] ?? {})
  const firstRawRow = rawRows[0] ?? {}
  const firstParsedRow = parsedRows[0] ?? null

  return {
    path,
    headers,
    rawRowCount: rawRows.length,
    parsedRowCount: parsedRows.length,
    firstRawRow: {
      MONTH: firstRawRow.MONTH ?? firstRawRow.month ?? "",
      YEAR: firstRawRow.YEAR ?? firstRawRow.year ?? "",
      AGENT_CODE: firstRawRow.AGENT_CODE ?? firstRawRow.agent_code ?? "",
      PINYIN: firstRawRow.PINYIN ?? firstRawRow.pinyin ?? "",
    },
    firstParsedRow,
  }
}

function formatWorkdirPermission(state: StoredWorkdirState) {
  if (!state.hasHandle) {
    return {
      text: "未连接",
      variant: "outline" as const,
    }
  }

  if (state.permission === "granted") {
    return {
      text: "已连接",
      variant: "success" as const,
    }
  }

  return {
    text: "需重新授权",
    variant: "warning" as const,
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<TabKey>("agents")
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS)
  const [settingsStatus, setSettingsStatus] = useState("")
  const [bootError, setBootError] = useState("")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [workdirState, setWorkdirState] = useState<StoredWorkdirState>(EMPTY_WORKDIR_STATE)
  const [pendingWorkdirHandle, setPendingWorkdirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [clearPendingWorkdir, setClearPendingWorkdir] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const [storedSettings, storedWorkdirState] = await Promise.all([loadSettings(), loadStoredWorkdirState()])

      if (cancelled) {
        return
      }

      startTransition(() => {
        setSettings({
          agentCode: storedSettings.agentCode,
          workdirName: storedSettings.workdirName || storedWorkdirState.name,
          workdirConnectedAt: storedSettings.workdirConnectedAt,
        })
        setWorkdirState(storedWorkdirState)
      })
    }

    void bootstrap().catch((error) => {
      if (!cancelled) {
        setBootError(error instanceof Error ? error.message : "读取设置失败")
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  async function refreshStoredWorkdirState() {
    const nextState = await loadStoredWorkdirState()

    startTransition(() => {
      setWorkdirState(nextState)
      setSettings((current) => ({
        ...current,
        workdirName: current.workdirName || nextState.name,
      }))
    })
  }

  async function handlePickWorkdir() {
    try {
      const handle = await pickWorkdirHandle()
      const connectedAt = new Date().toISOString()

      setPendingWorkdirHandle(handle)
      setClearPendingWorkdir(false)
      setSettings((current) => ({
        ...current,
        workdirName: handle.name,
        workdirConnectedAt: connectedAt,
      }))
      setSettingsStatus(`已选择工作目录 ${handle.name}`)
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return
      }

      setSettingsStatus(error instanceof Error ? error.message : "选择工作目录失败")
    }
  }

  function handleClearWorkdir() {
    setPendingWorkdirHandle(null)
    setClearPendingWorkdir(true)
    setSettings((current) => ({
      ...current,
      workdirName: "",
      workdirConnectedAt: "",
    }))
    setSettingsStatus("工作目录将在保存后清除")
  }

  async function handleSaveSettings() {
    try {
      let nextSettings = { ...settings }

      if (clearPendingWorkdir) {
        await clearWorkdirHandle()
        nextSettings = {
          ...nextSettings,
          workdirName: "",
          workdirConnectedAt: "",
        }
      } else if (pendingWorkdirHandle) {
        await saveWorkdirHandle(pendingWorkdirHandle)
        nextSettings = {
          ...nextSettings,
          workdirName: pendingWorkdirHandle.name,
          workdirConnectedAt: nextSettings.workdirConnectedAt || new Date().toISOString(),
        }
      }

      await saveSettings(nextSettings)
      await refreshStoredWorkdirState()

      startTransition(() => {
        setSettings(nextSettings)
        setPendingWorkdirHandle(null)
        setClearPendingWorkdir(false)
      })

      setSettingsStatus("设置已保存")
      setSettingsOpen(false)
      window.setTimeout(() => setSettingsStatus(""), 2000)
    } catch (error) {
      setSettingsStatus(error instanceof Error ? error.message : "保存失败")
    }
  }

  const workdirBadge = formatWorkdirPermission(workdirState)
  const displayedWorkdirName = clearPendingWorkdir
    ? ""
    : pendingWorkdirHandle?.name || settings.workdirName || workdirState.name

  return (
    <main className="flex h-dvh w-full flex-col gap-4 overflow-hidden p-6">
      {bootError ? (
        <Alert className="border-red-200 bg-red-50/90">
          <AlertTitle>初始化失败</AlertTitle>
          <AlertDescription>{bootError}</AlertDescription>
        </Alert>
      ) : null}

      {settingsStatus ? (
        <div className="flex">
          <Badge variant="secondary">{settingsStatus}</Badge>
        </div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-4 overflow-hidden lg:grid-cols-[240px_minmax(0,1fr)]">
        <Card className="min-h-0 border-border/70 bg-white/90 lg:flex lg:flex-col">
          <CardHeader>
            <CardTitle>PRU 数据导出</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-0 flex-1 flex-col gap-4 pt-0">
            <div className="space-y-1.5">
              <TabButton
                active={activeTab === "agents"}
                icon={<Users className="size-4" />}
                title="代理人信息"
                onClick={() => setActiveTab("agents")}
              />
              <TabButton
                active={activeTab === "sales"}
                icon={<WalletCards className="size-4" />}
                title="月汇总业绩"
                onClick={() => setActiveTab("sales")}
              />
            </div>
            <div className="mt-auto">
              <Button
                variant="outline"
                className="h-auto w-full justify-start py-3"
                aria-label="打开系统设置"
                title="系统设置"
                onClick={() => setSettingsOpen(true)}
              >
                <div className="min-w-0 text-left">
                  <div className="flex items-center gap-2">
                    <Settings2 className="size-4 shrink-0" />
                    <p className="text-sm font-medium">系统设置</p>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {(settings.agentCode || "未设置代理编号")}.{displayedWorkdirName || workdirBadge.text}
                  </p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {activeTab === "agents" ? (
          <AgentsPanel agentCode={settings.agentCode} />
        ) : (
          <SalesMonthPanel agentCode={settings.agentCode} workdirState={workdirState} />
        )}
      </div>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-lg" onClose={() => setSettingsOpen(false)}>
          <DialogHeader>
            <DialogTitle>系统设置</DialogTitle>
            <DialogDescription>填写代理人编号并连接工作目录后，月业绩会直接写入该目录。</DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium">代理人编号</label>
              <Input
                value={settings.agentCode}
                placeholder="请输入你的 PRU 代理人编号"
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    agentCode: event.target.value.trim(),
                  }))
                }
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">工作目录</label>
              <div className="flex items-center gap-2">
                <Badge variant={workdirBadge.variant}>{workdirBadge.text}</Badge>
                <div className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground">
                  {displayedWorkdirName || "尚未选择目录"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={handlePickWorkdir}>
                  <FolderOpen className="size-4" />
                  {displayedWorkdirName ? "重新选择目录" : "选择工作目录"}
                </Button>
                {displayedWorkdirName ? (
                  <Button variant="outline" onClick={handleClearWorkdir}>
                    <Trash2 className="size-4" />
                    清除目录
                  </Button>
                ) : null}
              </div>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveSettings}>保存设置</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}

function TabButton({
  active,
  icon,
  title,
  onClick,
}: {
  active: boolean
  icon: ReactNode
  title: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-md border px-3 py-2.5 text-left transition-all",
        active
          ? "border-orange-300 bg-orange-50 shadow-sm"
          : "border-border/60 bg-background/80 hover:border-orange-200 hover:bg-accent/70",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 text-sm font-medium">
        <span className={active ? "text-orange-600" : "text-muted-foreground"}>{icon}</span>
        <span>{title}</span>
      </div>
    </button>
  )
}

function AgentsPanel({ agentCode }: { agentCode: string }) {
  const [rows, setRows] = useState<AgentRow[]>([])
  const [stage, setStage] = useState("")
  const [error, setError] = useState("")

  async function handleFetch() {
    if (!agentCode) {
      setError("请先填写并保存代理人编号")
      return
    }

    setError("")
    setRows([])
    setStage("准备抓取...")

    try {
      const result = await fetchAgents(agentCode, setStage)
      startTransition(() => {
        setRows(result)
      })
      setStage(`抓取完成，共 ${result.length} 条`)
    } catch (fetchError) {
      setStage("")
      setError(fetchError instanceof Error ? fetchError.message : "抓取失败")
    }
  }

  function handleDownload() {
    const csv = toCsv(rows, AGENT_COLUMNS)
    downloadCsv(`pru-agents-${agentCode}-${getTimestamp()}.csv`, csv)
  }

  return (
    <ResultPanel
      title="代理人信息"
      description="导出团队代理人基础资料。"
      busy={Boolean(stage && !stage.startsWith("抓取完成"))}
      stage={stage}
      error={error}
      rowCount={rows.length}
      fetchAction={handleFetch}
      downloadAction={handleDownload}
      canDownload={rows.length > 0}
    >
      <PreviewTable
        columns={AGENT_COLUMNS}
        rows={rows}
        renderCell={(row, column) => row[column.key]}
      />
    </ResultPanel>
  )
}

function SalesMonthPanel({
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

  useEffect(() => {
    let cancelled = false

    async function loadPreview() {
      if (workdirState.permission !== "granted" || month) {
        return
      }

      try {
        const cachedFile = await loadLatestSalesMonthCacheFile()

        if (cancelled) {
          return
        }

        if (!cachedFile) {
          setCacheSourcePath("")
          setCacheRows([])
          startTransition(() => {
            setRows([])
          })
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

    void loadPreview()

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
        setCacheSourcePath("")
        setCacheRows([])
        startTransition(() => {
          setRows([])
        })
        return
      }

      try {
        const cachedFile = await loadSalesMonthCacheFileForMonth(month)

        if (cancelled) {
          return
        }

        if (!cachedFile) {
          setCacheSourcePath("")
          setCacheRows([])
          startTransition(() => {
            setRows([])
          })
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
          setCacheSourcePath("")
          setCacheRows([])
          startTransition(() => {
            setRows([])
          })
          setError(loadError instanceof Error ? loadError.message : "读取缓存失败")
        }
      }
    }

    void loadPreviewByMonth()

    return () => {
      cancelled = true
    }
  }, [month, workdirState.permission])

  async function handleFetch() {
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

  return (
    <ResultPanel
      title="月汇总业绩"
      description="导出指定月份的团队业绩数据，并直接写入工作目录。"
      busy={Boolean(stage && !stage.startsWith("抓取完成"))}
      stage={stage}
      error={error}
      rowCount={rows.length}
      fetchAction={handleFetch}
      controls={
        <div className="w-full max-w-[220px] space-y-2">
          <label className="text-sm font-medium">月份</label>
          <Input type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
        </div>
      }
      previewMeta={cacheSourcePath ? getFilename(cacheSourcePath) : ""}
    >
      <PreviewTable
        columns={SALES_TABLE_COLUMNS}
        rows={rows}
        stickyColumnCount={2}
        stickyColumnWidths={[96, 132]}
        renderCell={(row, column) => (column.format ? column.format(row[column.key], row) : row[column.key])}
      />
    </ResultPanel>
  )
}

function ResultPanel({
  title,
  description,
  busy,
  stage,
  error,
  rowCount,
  fetchAction,
  downloadAction,
  canDownload,
  controls,
  previewMeta,
  children,
}: {
  title: string
  description: string
  busy: boolean
  stage: string
  error: string
  rowCount: number
  fetchAction: () => void
  downloadAction?: () => void
  canDownload?: boolean
  controls?: ReactNode
  previewMeta?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="flex min-h-0 min-w-0 flex-col border-border/70 bg-white/90">
      <CardHeader>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={rowCount > 0 ? "success" : "outline"}>{rowCount} rows</Badge>
            {busy ? <Badge variant="warning">抓取中</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          {controls ?? <div />}
          <div className="flex flex-wrap gap-2">
            <Button onClick={fetchAction} disabled={busy}>
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              开始抓取
            </Button>
            {downloadAction ? (
              <Button variant="outline" onClick={downloadAction} disabled={!canDownload || busy}>
                <Download className="size-4" />
                下载 CSV
              </Button>
            ) : null}
          </div>
        </div>

        {stage ? (
          <Alert className="border-amber-200 bg-amber-50/80">
            <AlertTitle>执行状态</AlertTitle>
            <AlertDescription>{stage}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert className="border-red-200 bg-red-50/90">
            <AlertTitle>执行失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border/70 bg-white/75">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div>
              <h3 className="text-sm font-medium">结果预览</h3>
              <p className="text-xs text-muted-foreground">抓取结果会显示在这里，便于快速确认。</p>
            </div>
            {previewMeta ? <div className="text-xs text-muted-foreground">{previewMeta}</div> : null}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">{children}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function PreviewTable<T extends Record<string, unknown>>({
  columns,
  rows,
  renderCell,
  stickyColumnCount = 0,
  stickyColumnWidths = [],
}: {
  columns: Array<{ key: keyof T; label: string; format?: (value: T[keyof T], row: T) => string | number }>
  rows: T[]
  renderCell: (
    row: T,
    column: { key: keyof T; label: string; format?: (value: T[keyof T], row: T) => string | number },
  ) => React.ReactNode
  stickyColumnCount?: number
  stickyColumnWidths?: number[]
}) {
  function getStickyStyle(index: number) {
    if (index >= stickyColumnCount) {
      return undefined
    }

    const left = stickyColumnWidths.slice(0, index).reduce((sum, width) => sum + width, 0)
    const width = stickyColumnWidths[index]

    return {
      left,
      minWidth: width,
      width,
    }
  }

  if (rows.length === 0) {
    return (
      <div className="flex min-h-[220px] items-center justify-center px-6 text-sm text-muted-foreground">
        暂无数据，先执行一次抓取。
      </div>
    )
  }

  return (
    <Table>
      <TableHeader className="sticky top-0 z-10 bg-white/95 backdrop-blur">
        <TableRow>
          {columns.map((column, index) => (
            <TableHead
              key={String(column.key)}
              className={
                index < stickyColumnCount
                  ? "sticky z-20 bg-slate-100 shadow-[1px_0_0_0_rgba(15,23,42,0.14)]"
                  : undefined
              }
              style={getStickyStyle(index)}
            >
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, index) => (
          <TableRow key={index}>
            {columns.map((column, columnIndex) => (
              <TableCell
                key={String(column.key)}
                className={
                  columnIndex < stickyColumnCount
                    ? "sticky bg-slate-50 shadow-[1px_0_0_0_rgba(15,23,42,0.12)]"
                    : undefined
                }
                style={getStickyStyle(columnIndex)}
              >
                {renderCell(row, column)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default App
