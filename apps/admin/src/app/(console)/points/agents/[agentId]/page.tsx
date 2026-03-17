export const dynamic = "force-dynamic";

import {
  GetAgentPointBalanceQuery,
  ListAgentPointRecordsQuery,
  ListAgentRedemptionRecordsQuery,
} from "@reeka-office/domain-point";
import { ListAgentsQuery } from "@reeka-office/domain-user";
import { ArrowLeftIcon, PlusIcon } from "lucide-react";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";

import { PointGrantRecords } from "./point-grant-records";
import { PointRedemptionRecords } from "./point-redemption-records";
import { RecordTabs } from "./record-tabs";

type RecordTab = "grants" | "redemptions";

function parseRecordTab(value: string | undefined): RecordTab {
  if (value === "redemptions") {
    return "redemptions";
  }
  return "grants";
}

function RecordsLoadingFallback() {
  return <Empty title="记录加载中..." centered />;
}

export default async function AgentPointDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ agentId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ agentId: raw }, { tab }] = await Promise.all([params, searchParams]);
  const agentId = Number(raw);
  const activeTab = parseRecordTab(tab);

  if (!Number.isInteger(agentId) || agentId <= 0) {
    notFound();
  }

  const ctx = await getRequiredAdminContext();
  const [agent, balance, pointResult, redemptionResult] = await Promise.all([
    new ListAgentsQuery(ctx)
      .query()
      .then((items) => items.find((item) => item.id === agentId) ?? null),
    new GetAgentPointBalanceQuery(ctx, { agentId }).query(),
    new ListAgentPointRecordsQuery(ctx, { agentId }).query(),
    new ListAgentRedemptionRecordsQuery(ctx, { agentId }).query(),
  ]);

  if (!agent) {
    notFound();
  }

  const recordsSection =
    activeTab === "grants" ? (
      <PointGrantRecords agentId={agentId} />
    ) : (
      <PointRedemptionRecords agentId={agentId} />
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <LinkButton
              href="/points/agents"
              variant="ghost"
              size="sm"
              className="-ml-2"
            >
              <ArrowLeftIcon className="size-4" />
              返回列表
            </LinkButton>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {agent.name}
          </h1>
          <p className="font-mono text-sm text-muted-foreground">
            {agent.agentCode ?? "-"}
          </p>
          <p className="text-muted-foreground text-sm">代理人积分详情</p>
        </div>
        <LinkButton href={`/points/agents/new?agentId=${agentId}`} size="sm">
          <PlusIcon className="size-4" />
          新增积分
        </LinkButton>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="rounded-lg border bg-card px-5 py-4 min-w-[140px]">
          <p className="text-muted-foreground text-xs">当前积分余额</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {(balance?.currentPoints ?? 0).toLocaleString()}
          </p>
        </div>
        <div className="rounded-lg border bg-card px-5 py-4 min-w-[140px]">
          <p className="text-muted-foreground text-xs">发放记录</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {pointResult.total}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              条
            </span>
          </p>
        </div>
        <div className="rounded-lg border bg-card px-5 py-4 min-w-[140px]">
          <p className="text-muted-foreground text-xs">兑换记录</p>
          <p className="mt-1 text-3xl font-bold tabular-nums">
            {redemptionResult.total}
            <span className="ml-1 text-base font-normal text-muted-foreground">
              条
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <RecordTabs activeTab={activeTab} />

        <Suspense fallback={<RecordsLoadingFallback />}>
          {recordsSection}
        </Suspense>
      </div>
    </div>
  );
}
