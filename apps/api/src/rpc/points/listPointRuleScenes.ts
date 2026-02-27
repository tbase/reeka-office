import { ListPointItemsQuery } from "@reeka-office/domain-point";
import { defineFunc } from "@reeka-office/jsonrpc";
import { z } from "zod";

import type { RequestContext } from "./shared";

const inputSchema = z.void();

export type ListPointRuleScenesInput = z.infer<typeof inputSchema>;
export type ListPointRuleScenesOutput = string[];

export const listPointRuleScenes = defineFunc<RequestContext, typeof inputSchema, ListPointRuleScenesOutput>({
  inputSchema,
  execute: async () => {
    const items = await new ListPointItemsQuery().query();
    return Array.from(new Set(items.map((item) => item.category)));
  },
});
