import { GetCustomerTypeConfigQuery } from "@reeka-office/domain-crm";
import { createRpcError } from "@reeka-office/jsonrpc";

import { mustAgent, rpc } from "../../context";
import { customerTypeIdInputSchema } from "./shared";

export const getCustomerTypeConfig = rpc.define({
  inputSchema: customerTypeIdInputSchema,
  execute: mustAgent(async ({ input }) => {
    const config = await new GetCustomerTypeConfigQuery({
      customerTypeId: input.customerTypeId,
    }).query();

    if (!config?.enabled) {
      throw createRpcError.notFound("客户类型不存在或已停用");
    }

    return {
      ...config,
      profileFields: config.profileFields.filter((field) => field.enabled),
      tags: config.tags.filter((tag) => tag.enabled),
    };
  }),
});
