export const dynamic = "force-dynamic"

import { ListAgentPointBalancesQuery } from "@reeka-office/domain-point"
import { PlusIcon, UsersIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { LinkButton } from "@/components/ui/link-button"

export default async function AgentPointsPage() {
  const balances = await new ListAgentPointBalancesQuery().query()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">代理人积分</h1>
          <p className="text-muted-foreground text-sm">查看所有代理人当前积分，并进行积分发放。</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">共 {balances.length} 人</Badge>
          <LinkButton href="/points/agents/new" size="sm">
            <PlusIcon className="size-4" />
            新增积分
          </LinkButton>
        </div>
      </div>

      {balances.length === 0 ? (
        <div className="text-muted-foreground flex flex-col items-center rounded-md border border-dashed px-6 py-14 text-sm">
          <UsersIcon className="mb-3 size-9 opacity-30" />
          <p>暂无代理人积分记录。</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium">代理人编码</th>
                <th className="px-4 py-2.5 text-right font-medium">当前积分</th>
                <th className="px-4 py-2.5 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {balances.map((balance) => (
                <tr key={balance.agentCode} className="border-b last:border-b-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium">{balance.agentCode}</td>
                  <td className="px-4 py-3 text-right tabular-nums font-semibold">
                    {balance.currentPoints.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <LinkButton
                        href={`/points/agents/new?agentCode=${balance.agentCode}`}
                        variant="outline"
                        size="sm"
                      >
                        <PlusIcon className="size-3.5" />
                        新增
                      </LinkButton>
                      <LinkButton
                        href={`/points/agents/${balance.agentCode}`}
                        variant="outline"
                        size="sm"
                      >
                        查看
                      </LinkButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
