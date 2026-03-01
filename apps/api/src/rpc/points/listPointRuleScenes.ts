import { ListPointItemsQuery } from "@reeka-office/domain-point";
import { z } from "zod";

import { rpc } from "../../context";

const inputSchema = z.void();

export type ListPointRuleScenesInput = z.infer<typeof inputSchema>;
export type ListPointRuleScenesOutput = string[];

export const listPointRuleScenes = rpc.define({
  inputSchema,
  execute: async () => {
    const items = await new ListPointItemsQuery().query();
    return Array.from(new Set(items.map((item) => item.category)));
  },
});
