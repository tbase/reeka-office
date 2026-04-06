import { Settings2, Users, WalletCards } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TabButton } from "@/app-shell/components/tab-button"
import { type AppTabKey } from "@/app-shell/types"

function AppSidebar({
  activeTab,
  agentCode,
  workdirLabel,
  workdirStatusText,
  onTabChange,
  onOpenSettings,
}: {
  activeTab: AppTabKey
  agentCode: string
  workdirLabel: string
  workdirStatusText: string
  onTabChange: (tab: AppTabKey) => void
  onOpenSettings: () => void
}) {
  return (
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
            onClick={() => onTabChange("agents")}
          />
          <TabButton
            active={activeTab === "sales"}
            icon={<WalletCards className="size-4" />}
            title="月汇总业绩"
            onClick={() => onTabChange("sales")}
          />
        </div>
        <div className="mt-auto">
          <Button
            variant="outline"
            className="h-auto w-full justify-start py-3"
            aria-label="打开系统设置"
            title="系统设置"
            onClick={onOpenSettings}
          >
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-2">
                <Settings2 className="size-4 shrink-0" />
                <p className="text-sm font-medium">系统设置</p>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {agentCode || "未设置代理编号"}.{workdirLabel || workdirStatusText}
              </p>
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export { AppSidebar }
