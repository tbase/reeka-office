import { FolderOpen, Trash2 } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function SettingsDialog({
  open,
  agentCode,
  workdirBadge,
  displayedWorkdirName,
  onOpenChange,
  onAgentCodeChange,
  onPickWorkdir,
  onClearWorkdir,
  onSave,
}: {
  open: boolean
  agentCode: string
  workdirBadge: {
    text: string
    variant: "outline" | "success" | "warning"
  }
  displayedWorkdirName: string
  onOpenChange: (open: boolean) => void
  onAgentCodeChange: (agentCode: string) => void
  onPickWorkdir: () => void | Promise<void>
  onClearWorkdir: () => void
  onSave: () => void | Promise<void>
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>系统设置</DialogTitle>
          <DialogDescription>
            填写代理人编号并连接工作目录后，代理人信息和月业绩会直接写入该目录。
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium">代理人编号</label>
            <Input
              value={agentCode}
              placeholder="请输入你的 PRU 代理人编号"
              onChange={(event) => onAgentCodeChange(event.target.value.trim())}
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
              <Button variant="outline" onClick={onPickWorkdir}>
                <FolderOpen className="size-4" />
                {displayedWorkdirName ? "重新选择目录" : "选择工作目录"}
              </Button>
              {displayedWorkdirName ? (
                <Button variant="outline" onClick={onClearWorkdir}>
                  <Trash2 className="size-4" />
                  清除目录
                </Button>
              ) : null}
            </div>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={onSave}>保存设置</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export { SettingsDialog }
