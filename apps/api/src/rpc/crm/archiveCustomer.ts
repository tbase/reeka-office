import { ArchiveCustomerCommand } from "@reeka-office/domain-crm";
import { createRpcError } from "@reeka-office/jsonrpc";

import { mustAgent, rpc } from "../../context";
import { customerIdInputSchema } from "./shared";

export const archiveCustomer = rpc.define({
  inputSchema: customerIdInputSchema,
  execute: mustAgent(async ({ context, input }) => {
    const ok = await new ArchiveCustomerCommand({
      agentId: context.user.agentId,
      customerId: input.customerId,
    }).execute();
    if (!ok) {
      throw createRpcError.notFound("客户不存在或已归档");
    }

    return { success: true };
  }),
});
