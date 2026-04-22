import {
  ListAgentLogsQuery,
  ListAgentsQuery,
  getDesignationName,
} from "@reeka-office/domain-agent";
import { ListActiveTenantAgentBindingsQuery } from "@reeka-office/domain-identity";
import { InfoIcon, UsersIcon } from "lucide-react";

import { Empty } from "@/components/ui/empty";
import {
  StickyTable,
  StickyTableBodyCell,
  StickyTableHeaderCell,
} from "@/components/ui/sticky-table";
import { getRequiredAdminContext } from "@/lib/admin-context";

import { AgentLogsSheet } from "./agent-logs-sheet";
import type { AgentSort } from "./search-params";

const agentCodeColumnClass = "w-[160px] min-w-[160px] max-w-[160px]";

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

function formatDateTime(value: Date | string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString("zh-CN", {
    hour12: false,
  });
}

export async function AgentList({ agency, sort }: AgentListProps) {
  const { tenantCode } = await getRequiredAdminContext();
  const agents = await new ListAgentsQuery({
    agency,
    sort,
  }).query();
  const activeBindings = await new ListActiveTenantAgentBindingsQuery({
    tenantCode,
    agentIds: agents.map((agent) => agent.id),
  }).query();
  const agentLogs = await new ListAgentLogsQuery({
    agentCodes: agents
      .map((agent) => agent.agentCode)
      .filter((agentCode): agentCode is string => !!agentCode),
  }).query();
  const activationTimeByAgentId = new Map(
    activeBindings.map((binding) => [binding.agentId, binding.boundAt]),
  );
  const logsByAgentCode = agentLogs.reduce((map, log) => {
    const current = map.get(log.agentCode)

    if (current) {
      current.push(log)
    } else {
      map.set(log.agentCode, [log])
    }

    return map
  }, new Map<string, typeof agentLogs>())
  const designationStats = Array.from(
    agents
      .reduce((stats, agent) => {
        const label = getDesignationName(agent.designation) ?? "未设置职级";
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
        <StickyTable
          className="rounded-none border-0"
          viewportClassName="max-h-[calc(100vh-14rem)]"
          tableClassName="w-full min-w-[1200px]"
        >
          <thead>
            <tr className="border-b bg-muted/50">
              <StickyTableHeaderCell
                stickyLeft
                className={`${agentCodeColumnClass} text-left`}
              >
                代理人编码
              </StickyTableHeaderCell>
              <StickyTableHeaderCell className="text-left">
                姓名
              </StickyTableHeaderCell>
              <StickyTableHeaderCell className="text-left">
                加入时间
              </StickyTableHeaderCell>
              <StickyTableHeaderCell className="text-left">
                职级
              </StickyTableHeaderCell>
              <StickyTableHeaderCell className="text-left">
                直属上级
              </StickyTableHeaderCell>
              <StickyTableHeaderCell className="text-left">
                财务包
              </StickyTableHeaderCell>
              <StickyTableHeaderCell className="text-left">
                组织架构
              </StickyTableHeaderCell>
              <StickyTableHeaderCell className="text-left">
                激活时间
              </StickyTableHeaderCell>
              <StickyTableHeaderCell className="text-left">
                日志
              </StickyTableHeaderCell>
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
              const activationTime = formatDateTime(
                activationTimeByAgentId.get(agent.id) ?? null,
              );
              const logs = agent.agentCode
                ? logsByAgentCode.get(agent.agentCode) ?? []
                : [];

              return (
                <tr
                  key={agent.id}
                  className="group border-b transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <StickyTableBodyCell
                    stickyLeft
                    className={`${agentCodeColumnClass} bg-background font-mono font-medium group-hover:bg-muted/30`}
                  >
                    {agent.agentCode ?? "-"}
                  </StickyTableBodyCell>
                  <StickyTableBodyCell>{agent.name}</StickyTableBodyCell>
                  <StickyTableBodyCell>
                    {formatMonth(agent.joinDate)}
                  </StickyTableBodyCell>
                  <StickyTableBodyCell>
                    {getDesignationName(agent.designation) ?? "-"}
                  </StickyTableBodyCell>
                  <StickyTableBodyCell className="font-mono">
                    {agent.leaderCode ?? "-"}
                  </StickyTableBodyCell>
                  <StickyTableBodyCell>
                    {agent.finacingScheme?.length
                      ? agent.finacingScheme.join(", ")
                      : "-"}
                  </StickyTableBodyCell>
                  <StickyTableBodyCell>
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
                  </StickyTableBodyCell>
                  <StickyTableBodyCell>
                    {activationTime ?? ""}
                  </StickyTableBodyCell>
                  <StickyTableBodyCell>
                    {agent.agentCode ? (
                      <AgentLogsSheet
                        agentCode={agent.agentCode}
                        agentName={agent.name}
                        logs={logs}
                      />
                    ) : null}
                  </StickyTableBodyCell>
                </tr>
              );
            })}
          </tbody>
        </StickyTable>

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
