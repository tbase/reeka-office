export const dynamic = "force-dynamic";

import { ListAgentPointBalancesQuery } from "@reeka-office/domain-point";
import { ListAgentsQuery } from "@reeka-office/domain-user";
import { PlusIcon, UsersIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";

export default async function AgentPointsPage() {
  const ctx = await getRequiredAdminContext();
  const [balances, agents] = await Promise.all([
    new ListAgentPointBalancesQuery(ctx).query(),
    new ListAgentsQuery(ctx).query(),
  ]);
  const agentMap = new Map(agents.map((agent) => [agent.id, agent]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">代理人积分</h1>
          <p className="text-muted-foreground text-sm">
            查看所有代理人当前积分，并进行积分发放。
          </p>
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
        <Empty
          title="暂无代理人积分记录。"
          icon={<UsersIcon className="size-9 opacity-60" />}
          centered
          className="py-14"
        />
      ) : (
        <div className="overflow-hidden rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium">
                  代理人编码
                </th>
                <th className="px-4 py-2.5 text-right font-medium">当前积分</th>
                <th className="px-4 py-2.5 text-right font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {balances.map((balance) => {
                const agent = agentMap.get(balance.agentId);

                return (
                  <tr
                    key={balance.agentId}
                    className="border-b last:border-b-0 hover:bg-muted/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-medium">
                      {agent?.agentCode ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      {balance.currentPoints.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <LinkButton
                          href={`/points/agents/new?agentId=${balance.agentId}`}
                          variant="outline"
                          size="sm"
                        >
                          <PlusIcon className="size-3.5" />
                          新增
                        </LinkButton>
                        <LinkButton
                          href={`/points/agents/${balance.agentId}`}
                          variant="outline"
                          size="sm"
                        >
                          查看
                        </LinkButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
