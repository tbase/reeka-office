import { ListPointItemsQuery } from "@reeka-office/domain-point";
import { ListAgentsQuery } from "@reeka-office/domain-user";

import { AgentPointRecordFormDialog } from "./form-dialog";

function parseOptionalAgentId(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? String(id) : undefined;
}

export default async function AgentPointRecordNewModal({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const defaultAgentId = parseOptionalAgentId(
    typeof params.agentId === "string" ? params.agentId : undefined,
  );

  const [pointItems, agents] = await Promise.all([
    new ListPointItemsQuery().query(),
    new ListAgentsQuery().query(),
  ]);

  return (
    <AgentPointRecordFormDialog
      pointItems={pointItems}
      agents={agents}
      defaultAgentId={defaultAgentId}
    />
  );
}
