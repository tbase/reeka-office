export const dynamic = "force-dynamic";

import { ListPointItemsQuery } from "@reeka-office/domain-point";

import { AgentPointRecordForm } from "@/components/points/agent-point-record-form";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";

import {
  createAgentPointRecordAction,
  searchAgentsAction,
} from "../actions";

export default async function AgentPointsCreatePage() {
  await getRequiredAdminContext();
  const pointItems = await new ListPointItemsQuery().query();

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          新增代理人积分
        </h1>
        <p className="text-muted-foreground text-sm">
          发放时会校验事项年次数上限，并自动累计当前积分余额。
        </p>
      </div>

      <AgentPointRecordForm
        id="agent-point-record-form"
        action={createAgentPointRecordAction}
        pointItems={pointItems}
        searchAgentsAction={searchAgentsAction}
      />

      <div className="flex gap-2">
        <Button
          type="submit"
          form="agent-point-record-form"
          disabled={pointItems.length === 0}
        >
          发放积分
        </Button>
        <LinkButton href="/points/agents" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  );
}
