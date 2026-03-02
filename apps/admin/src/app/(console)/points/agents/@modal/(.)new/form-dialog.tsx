"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AgentPointRecordForm } from "@/components/points/agent-point-record-form"
import type { PointItemRow } from "@reeka-office/domain-point"
import type { Agent } from "@reeka-office/domain-user"

import { createAgentPointRecordAction } from "../../actions"

type PointItem = Pick<PointItemRow, "id" | "name">
type AgentOption = Pick<Agent, "agentCode" | "name">

export function AgentPointRecordFormDialog({
  pointItems,
  agents,
  defaultAgentCode,
}: {
  pointItems: PointItem[]
  agents: AgentOption[]
  defaultAgentCode?: string
}) {
  const router = useRouter()

  function handleClose() {
    router.back()
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增积分</DialogTitle>
          <DialogDescription>
            发放时会校验事项年次数上限，并自动累计当前积分余额。
          </DialogDescription>
        </DialogHeader>
        <AgentPointRecordForm
          action={createAgentPointRecordAction}
          id="agent-point-record-form"
          pointItems={pointItems}
          agents={agents}
          defaultAgentCode={defaultAgentCode}
          onSuccess={() => router.back()}
        />
        <DialogFooter>
          <Button
            type="submit"
            form="agent-point-record-form"
            disabled={pointItems.length === 0}
          >
            发放积分
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
