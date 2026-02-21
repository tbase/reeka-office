export const dynamic = "force-dynamic"

import {
  GetAgentPointBalanceQuery,
  ListAgentPointRecordsQuery,
  ListAgentRedemptionRecordsQuery,
} from "@reeka-office/domain-point"
import { ArrowLeftIcon, PlusIcon } from "lucide-react"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { LinkButton } from "@/components/ui/link-button"

const AGENT_CODE_REGEX = /^[A-Za-z0-9]{8}$/

function formatDateTime(date: Date): string {
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const h = String(date.getHours()).padStart(2, "0")
  const mi = String(date.getMinutes()).padStart(2, "0")
  return `${y}-${mo}-${d} ${h}:${mi}`
}

export default async function AgentPointDetailPage({
  params,
}: {
  params: Promise<{ agentCode: string }>
}) {
  const { agentCode: raw } = await params
  const agentCode = raw.toUpperCase()

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
        <h2 className="text-base font-semibold">积分发放记录</h2>
        {pointResult.records.length === 0 ? (
          <div className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
            暂无发放记录。
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">积分事项</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">类别</th>
                  <th className="px-4 py-2.5 text-right font-medium">积分</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">年份</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">发放时间</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">备注</th>
                </tr>
              </thead>
              <tbody>
                {pointResult.records.map((record) => (
                  <tr key={record.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{record.pointItemName}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{record.pointItemCategory}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant="secondary">+{record.points}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-center text-muted-foreground">{record.occurredYear}</td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums">
                      {formatDateTime(record.createdAt)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{record.remark || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h2 className="text-base font-semibold">积分兑换记录</h2>
        {redemptionResult.records.length === 0 ? (
          <div className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
            暂无兑换记录。
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2.5 text-left font-medium">兑换商品</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">类别</th>
                  <th className="px-4 py-2.5 text-right font-medium">消耗积分</th>
                  <th className="px-4 py-2.5 text-center font-medium text-muted-foreground">状态</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">兑换时间</th>
                  <th className="px-4 py-2.5 text-left font-medium text-muted-foreground">备注</th>
                </tr>
              </thead>
              <tbody>
                {redemptionResult.records.map((record) => (
                  <tr key={record.id} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-medium">{record.productTitle}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{record.redeemCategory}</td>
                    <td className="px-4 py-2.5 text-right">
                      <Badge variant="outline">-{record.pointsCost}</Badge>
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {record.status === "success" ? (
                        <Badge variant="secondary">成功</Badge>
                      ) : (
                        <Badge variant="destructive">已取消</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground text-xs tabular-nums">
                      {formatDateTime(record.redeemedAt)}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{record.remark || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
