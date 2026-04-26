import { GetCustomerDetailQuery } from "@reeka-office/domain-crm";
import { createRpcError } from "@reeka-office/jsonrpc";

import { mustAgent, rpc } from "../../context";
import { customerIdInputSchema } from "./shared";

export const getCustomer = rpc.define({
  inputSchema: customerIdInputSchema,
  execute: mustAgent(async ({ context, input }) => {
    const customer = await new GetCustomerDetailQuery({
      agentId: context.user.agentId,
      customerId: input.customerId,
    }).query();

    if (!customer) {
      throw createRpcError.notFound("客户不存在");
    }

    return customer;
  }),
});
