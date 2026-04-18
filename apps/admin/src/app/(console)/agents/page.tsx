export const dynamic = "force-dynamic";

import { ListAgentAgenciesQuery, ListAgentsQuery } from "@reeka-office/domain-agent";
import { Suspense } from "react";

import { Empty } from "@/components/ui/empty";
import { getRequiredAdminContext } from "@/lib/admin-context";

import { AgentFilters } from "./agent-filters";
import { AgentList } from "./agent-list";
import { GenerateBindingTokensDialog } from "./generate-binding-tokens-dialog";
import { ImportAgentsDialog } from "./import-agents-dialog";
import { parseAgencyFilter, parseAgentSort } from "./search-params";

export default async function AgentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  await getRequiredAdminContext();
  const agencies = await new ListAgentAgenciesQuery().query();
  const requestedAgency = parseAgencyFilter(
    typeof params.agency === "string" ? params.agency : undefined,
  );
  const agency =
    requestedAgency && agencies.includes(requestedAgency)
      ? requestedAgency
      : null;
  const agents = await new ListAgentsQuery({
    sort: "designation_desc",
  }).query();
  const divisions = [...new Set(
    agents
      .map((agent) => agent.division?.trim() ?? "")
      .filter((division) => division.length > 0),
  )].sort((left, right) => left.localeCompare(right, "zh-CN"));
  const sort = parseAgentSort(
    typeof params.sort === "string" ? params.sort : undefined,
  );

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              代理人管理
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <GenerateBindingTokensDialog divisions={divisions} />
            <ImportAgentsDialog />
          </div>
        </div>

        <AgentFilters
          agencies={agencies}
          activeAgency={agency}
          activeSort={sort}
        />
      </div>

      <Suspense
        key={`${agency ?? "all"}:${sort}`}
        fallback={<Empty title="正在加载代理人..." />}
      >
        <AgentList agency={agency} sort={sort} />
      </Suspense>
    </div>
  );
}
