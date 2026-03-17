import { ListPointItemsQuery } from "@reeka-office/domain-point";

import { getRequiredAdminContext } from "@/lib/admin-context";

import { searchAgentsAction } from "../../actions";
import { AgentPointRecordFormDialog } from "./form-dialog";

export default async function AgentPointRecordNewModal() {
  await getRequiredAdminContext();
  const pointItems = await new ListPointItemsQuery().query();

  return (
    <AgentPointRecordFormDialog
      pointItems={pointItems}
      searchAgentsAction={searchAgentsAction}
    />
  );
}
