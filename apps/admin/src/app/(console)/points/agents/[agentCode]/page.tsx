export const dynamic = "force-dynamic"

import {
  GetAgentPointBalanceQuery,
  ListAgentPointRecordsQuery,
  ListAgentRedemptionRecordsQuery,
} from "@reeka-office/domain-point"
import { ArrowLeftIcon, PlusIcon } from "lucide-react"
import { notFound } from "next/navigation"

import { LinkButton } from "@/components/ui/link-button"

import { PointGrantRecords } from "./point-grant-records"
import { PointRedemptionRecords } from "./point-redemption-records"
import { RecordTabs } from "./record-tabs"

const AGENT_CODE_REGEX = /^[A-Za-z0-9]{8}$/

type RecordTab = "grants" | "redemptions"

function parseRecordTab(value: string | undefined): RecordTab {
  if (value === "redemptions") {
    return "redemptions"
  }
  return "grants"
}

export default async function AgentPointDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentCode: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const [{ agentCode: raw }, { tab }] = await Promise.all([params, searchParams])
  const agentCode = raw.toUpperCase()
  const activeTab = parseRecordTab(tab)

  if (!AGENT_CODE_REGEX.test(agentCode)) {
    notFound()
  }

  const [balance, pointResult, redemptionResult] = await Promise.all([
    new GetAgentPointBalanceQuery({ agentCode }).query(),
    new ListAgentPointRecordsQuery({ agentCode }).query(),
    new ListAgentRedemptionRecordsQuery({ agentCode }).query(),
  ])

  if (!balance) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LinkButton href="/points/agents" variant="ghost" size="sm" className="-ml-2">
              <ArrowLeftIcon className="size-4" />
              返回列表
            </LinkButton>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight font-mono">{agentCode}</h1>
          <p className="text-muted-foreground text-sm">代理人积分详情</p>
        </div>
        <LinkButton href={`/points/agents/new?agentCode=${agentCode}`} size="sm">
          <PlusIcon className="size-4" />
          新增积分
        </LinkButton>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border bg-card px-5 py-4 min-w-[140px]">
          <p className="text-muted-foreground text-xs">当前积分余额</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {balance.currentPoints.toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-5 py-4 min-w-[140px]">
          <p className="text-muted-foreground text-xs">发放记录</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {pointResult.total}
            <span className="ml-1 text-base font-normal text-muted-foreground">条</span>
          </p>
        </div>
        <div className="rounded-lg border bg-card px-5 py-4 min-w-[140px]">
          <p className="text-muted-foreground text-xs">兑换记录</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {redemptionResult.total}
            <span className="ml-1 text-base font-normal text-muted-foreground">条</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <RecordTabs activeTab={activeTab} />

        {activeTab === "grants" ? (
          <PointGrantRecords agentCode={agentCode} />
        ) : (
          <PointRedemptionRecords agentCode={agentCode} />
        )}
      </div>
    </div>
  )
}
