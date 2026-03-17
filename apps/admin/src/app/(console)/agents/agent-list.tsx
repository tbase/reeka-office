import { ListAgentsQuery } from "@reeka-office/domain-user";
import { InfoIcon, UsersIcon } from "lucide-react";

import { Empty } from "@/components/ui/empty";

import type { AgentSort } from "./search-params";

interface AgentListProps {
  agency: string | null;
  sort: AgentSort;
}

function formatMonth(value: string | null) {
  if (!value) {
    return "-";
  }

  return value.slice(0, 7);
}

function formatOrganization(parts: Array<string | null>) {
  return parts.filter((item) => !!item).join(" / ") || "-";
}

export async function AgentList({ agency, sort }: AgentListProps) {
  const agents = await new ListAgentsQuery({
    agency,
    sort,
  }).query();
  const designationStats = Array.from(
    agents
      .reduce((stats, agent) => {
        const label = agent.designationName ?? "未设置职级";
        const order = agent.designation ?? Number.MAX_SAFE_INTEGER;
        const current = stats.get(label);

        stats.set(label, {
          label,
          order: current?.order ?? order,
          count: (current?.count ?? 0) + 1,
        });

        return stats;
      }, new Map<string, { label: string; order: number; count: number }>())
      .values(),
  ).sort((left, right) => right.order - left.order);

  if (agents.length === 0) {
    return (
      <Empty
        title={agency ? "当前机构下暂无代理人。" : "暂无代理人。"}
        description={
          agency
            ? "当前筛选机构下还没有可展示的代理人数据。"
            : "当前还没有可展示的代理人数据。"
        }
        icon={<UsersIcon className="size-9 opacity-60" />}
        centered
        className="py-14"
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-md border">
        <div className="max-h-[calc(100vh-16.5rem)] overflow-auto">
          <table className="min-w-[1200px] w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-2.5 text-left font-medium">
                  代理人编码
                </th>
                <th className="px-4 py-2.5 text-left font-medium">姓名</th>
                <th className="px-4 py-2.5 text-left font-medium">加入时间</th>
                <th className="px-4 py-2.5 text-left font-medium">职级</th>
                <th className="px-4 py-2.5 text-left font-medium">直属上级</th>
                <th className="px-4 py-2.5 text-left font-medium">财务包</th>
                <th className="px-4 py-2.5 text-left font-medium">组织架构</th>
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const organization = formatOrganization([
                  agent.agency,
                  agent.division,
                ]);
                const fullOrganization = formatOrganization([
                  agent.agency,
                  agent.division,
                  agent.branch,
                  agent.unit,
                ]);

                return (
                  <tr
                    key={agent.id}
                    className="border-b transition-colors last:border-b-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-mono font-medium">
                      {agent.agentCode ?? "-"}
                    </td>
                    <td className="px-4 py-3">{agent.name}</td>
                    <td className="px-4 py-3">{formatMonth(agent.joinDate)}</td>
                    <td className="px-4 py-3">{agent.designationName ?? "-"}</td>
                    <td className="px-4 py-3 font-mono">
                      {agent.leaderCode ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      {agent.finacingScheme?.length
                        ? agent.finacingScheme.join(", ")
                        : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span>{organization}</span>
                        {fullOrganization !== "-" ? (
                          <span
                            title={fullOrganization}
                            aria-label={`完整组织架构：${fullOrganization}`}
                            className="text-muted-foreground inline-flex cursor-help"
                          >
                            <InfoIcon className="size-3.5" />
                          </span>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-muted/20 text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-2 border-t px-4 py-3 text-xs">
          <span className="text-foreground font-medium">
            共 {agents.length} 人
          </span>
          {designationStats.map((item) => (
            <span key={item.label} className="tabular-nums">
              {item.label} {item.count} 人
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
