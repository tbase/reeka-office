import { ListCustomersQuery } from "@reeka-office/domain-crm";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";
import { getNameInitial } from "./nameInitial";
import { customerSortSchema } from "./shared";

export const listCustomers = rpc.define({
  inputSchema: z.object({
    keyword: z.string().optional().nullable(),
    customerTypeId: z.number().int().positive().optional().nullable(),
    sort: customerSortSchema.optional(),
  }).optional(),
  execute: mustAgent(async ({ context, input }) => {
    const customers = await new ListCustomersQuery({
      agentId: context.user.agentId,
      keyword: input?.keyword,
      customerTypeId: input?.customerTypeId,
      sort: input?.sort,
    }).query();

    return customers.map((customer) => ({
      ...customer,
      nameInitial: customer.nameInitial === "#"
        ? getNameInitial(customer.name)
        : customer.nameInitial,
    }));
  }),
});
