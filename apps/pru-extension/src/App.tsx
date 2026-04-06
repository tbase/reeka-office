import { useState } from "react"

import { AgentsPanel } from "@/agents/components/agents-panel"
import { AppSidebar } from "@/app-shell/components/app-sidebar"
import { type AppTabKey } from "@/app-shell/types"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { SalesMonthPanel } from "@/sales-month/components/sales-month-panel"
import { SettingsDialog } from "@/settings/components/settings-dialog"
import { useExtensionSettings } from "@/settings/hooks/use-extension-settings"

function App() {
  const [activeTab, setActiveTab] = useState<AppTabKey>("agents")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const {
    settings,
    settingsStatus,
    bootError,
    workdirState,
    workdirBadge,
    displayedWorkdirName,
    setAgentCode,
    pickWorkdir,
    clearWorkdir,
    saveSettings,
  } = useExtensionSettings()

  async function handleSaveSettings() {
    try {
      await saveSettings()
      setSettingsOpen(false)
    } catch {
      return
    }
  }

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
        <AppSidebar
          activeTab={activeTab}
          agentCode={settings.agentCode}
          workdirLabel={displayedWorkdirName}
          workdirStatusText={workdirBadge.text}
          onTabChange={setActiveTab}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {activeTab === "agents" ? (
          <AgentsPanel agentCode={settings.agentCode} workdirState={workdirState} />
        ) : (
          <SalesMonthPanel agentCode={settings.agentCode} workdirState={workdirState} />
        )}
      </div>

      <SettingsDialog
        open={settingsOpen}
        agentCode={settings.agentCode}
        workdirBadge={workdirBadge}
        displayedWorkdirName={displayedWorkdirName}
        onOpenChange={setSettingsOpen}
        onAgentCodeChange={setAgentCode}
        onPickWorkdir={pickWorkdir}
        onClearWorkdir={clearWorkdir}
        onSave={handleSaveSettings}
      />
    </main>
  )
}

export default App
