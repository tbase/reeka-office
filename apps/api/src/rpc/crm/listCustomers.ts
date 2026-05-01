import { ListCustomersQuery } from "@reeka-office/domain-crm";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { customerSortSchema } from "./shared";

export const listCustomers = rpc.define({
  inputSchema: z.object({
    keyword: z.string().optional().nullable(),
    customerTypeId: z.number().int().positive().optional().nullable(),
    sort: customerSortSchema.optional(),
  }).optional(),
  execute: mustAgent(async ({ context, input }) => {
    return new ListCustomersQuery({
      agentId: context.user.agentId,
      keyword: input?.keyword,
      customerTypeId: input?.customerTypeId,
      sort: input?.sort,
    }).query();
  }),
});
