export const dynamic = "force-dynamic"

import { ListAgentAgenciesQuery } from "@reeka-office/domain-agent"
import { Suspense } from "react"

import { Empty } from "@/components/ui/empty"
import { getRequiredAdminContext } from "@/lib/admin-context"
import { getPruCookieStatus } from "@/lib/pru-cookie"

import { AgentFilters } from "./agent-filters"
import { AgentList } from "./agent-list"
import { ImportAgentsDialog } from "./import-agents-dialog"
import { PruCookieCard } from "./pru-cookie-card"
import { parseAgencyFilter, parseAgentSort } from "./search-params"

export default async function AgentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  await getRequiredAdminContext()
  const [agencies, pruCookieStatus] = await Promise.all([
    new ListAgentAgenciesQuery().query(),
    getPruCookieStatus(),
  ])
  const requestedAgency = parseAgencyFilter(
    typeof params.agency === "string" ? params.agency : undefined,
  )
  const agency = requestedAgency && agencies.includes(requestedAgency)
    ? requestedAgency
    : null
  const sort = parseAgentSort(
    typeof params.sort === "string" ? params.sort : undefined,
  )

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">代理人管理</h1>
            <p className="text-muted-foreground text-sm">
              查看代理人基础信息。
            </p>
          </div>
          <ImportAgentsDialog />
        </div>

        <PruCookieCard status={pruCookieStatus} />

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
  )
}
