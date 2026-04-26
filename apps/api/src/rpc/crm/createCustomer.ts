import { CreateCustomerCommand } from "@reeka-office/domain-crm";

import { mustAgent, rpc } from "../../context";
import { customerPayloadSchema } from "./shared";

export const createCustomer = rpc.define({
  inputSchema: customerPayloadSchema,
  execute: mustAgent(async ({ context, input }) => {
    return new CreateCustomerCommand({
      agentId: context.user.agentId,
      customerTypeId: input.customerTypeId,
      name: input.name,
      gender: input.gender,
      phone: input.phone,
      wechat: input.wechat,
      tags: input.tags,
      note: input.note,
      profileValues: input.profileValues,
      allowDuplicate: input.allowDuplicate,
    }).execute();
  }),
});
