import { z } from "zod";

import { GetContentQuery } from "@reeka-office/domain-cms";
import { createRpcError } from "@reeka-office/jsonrpc";
import { mustAgent, rpc } from "../../context";
import { normalizeResourceContent, type ResourceContent } from "./resourceShared";

const inputSchema = z.object({
  id: z.number().int().positive(),
});

export type GetResourceContentInput = z.infer<typeof inputSchema>;
export type GetResourceContentOutput = ResourceContent;

export const getResourceContent = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ input }): Promise<GetResourceContentOutput> => {
    const result = await new GetContentQuery({ id: input.id }).query();

    if (!result) {
      throw createRpcError.notFound("资源不存在");
    }

    return normalizeResourceContent(result);
  }),
});
