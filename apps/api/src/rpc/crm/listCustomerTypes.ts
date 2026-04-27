import { ListCustomerTypeSummariesQuery } from "@reeka-office/domain-crm";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";

export const listCustomerTypes = rpc.define({
  inputSchema: z.void(),
  execute: mustAgent(async () => {
    return new ListCustomerTypeSummariesQuery({ enabled: true }).query();
  }),
});
