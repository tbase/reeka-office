import { UpdateCustomerCommand } from "@reeka-office/domain-crm";

import { mustAgent, rpc } from "../../context";
import { customerIdInputSchema, customerPayloadSchema } from "./shared";

export const updateCustomer = rpc.define({
  inputSchema: customerPayloadSchema.merge(customerIdInputSchema),
  execute: mustAgent(async ({ context, input }) => {
    return new UpdateCustomerCommand({
      agentId: context.user.agentId,
      customerId: input.customerId,
      customerTypeId: input.customerTypeId,
      name: input.name,
      gender: input.gender,
      birthday: input.birthday,
      city: input.city,
      phone: input.phone,
      wechat: input.wechat,
      tags: input.tags,
      note: input.note,
      profileValues: input.profileValues,
      allowDuplicate: input.allowDuplicate,
    }).execute();
  }),
});
