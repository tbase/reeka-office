import { startTransition, useEffect, useState } from "react"

import {
  loadSettings,
  saveSettings as persistSettings,
  type ExtensionSettings,
} from "@/lib/chrome"
import {
  clearWorkdirHandle,
  loadStoredWorkdirState,
  pickWorkdirHandle,
  saveWorkdirHandle,
  type StoredWorkdirState,
} from "@/lib/workdir"

type WorkdirBadge = {
  text: string
  variant: "outline" | "success" | "warning"
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

function formatWorkdirPermission(state: StoredWorkdirState): WorkdirBadge {
  if (!state.hasHandle) {
    return {
      text: "未连接",
      variant: "outline",
    }
  }

  if (state.permission === "granted") {
    return {
      text: "已连接",
      variant: "success",
    }
  }

  return {
    text: "需重新授权",
    variant: "warning",
  }
}

function useExtensionSettings() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS)
  const [settingsStatus, setSettingsStatus] = useState("")
  const [bootError, setBootError] = useState("")
  const [workdirState, setWorkdirState] = useState<StoredWorkdirState>(EMPTY_WORKDIR_STATE)
  const [pendingWorkdirHandle, setPendingWorkdirHandle] = useState<FileSystemDirectoryHandle | null>(null)
  const [clearPendingWorkdir, setClearPendingWorkdir] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      const [storedSettings, storedWorkdirState] = await Promise.all([
        loadSettings(),
        loadStoredWorkdirState(),
      ])

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

      await persistSettings(nextSettings)
      await refreshStoredWorkdirState()

      startTransition(() => {
        setSettings(nextSettings)
        setPendingWorkdirHandle(null)
        setClearPendingWorkdir(false)
      })

      setSettingsStatus("设置已保存")
      window.setTimeout(() => setSettingsStatus(""), 2000)
    } catch (error) {
      setSettingsStatus(error instanceof Error ? error.message : "保存失败")
      throw error
    }
  }

  const workdirBadge = formatWorkdirPermission(workdirState)
  const displayedWorkdirName = clearPendingWorkdir
    ? ""
    : pendingWorkdirHandle?.name || settings.workdirName || workdirState.name

  return {
    settings,
    settingsStatus,
    bootError,
    workdirState,
    workdirBadge,
    displayedWorkdirName,
    setAgentCode(agentCode: string) {
      setSettings((current) => ({
        ...current,
        agentCode,
      }))
    },
    pickWorkdir: handlePickWorkdir,
    clearWorkdir: handleClearWorkdir,
    saveSettings: handleSaveSettings,
  }
}

export { useExtensionSettings }
