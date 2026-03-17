import { ListPointItemsQuery } from "@reeka-office/domain-point";
import { z } from "zod";

import { mustAgent, rpc } from "../../context";

const inputSchema = z.void();

export type ListPointRuleScenesInput = z.infer<typeof inputSchema>;
export type ListPointRuleScenesOutput = string[];

export const listPointRuleScenes = rpc.define({
  inputSchema,
  execute: mustAgent(async ({ context }) => {
    const items = await new ListPointItemsQuery(context).query();
    return Array.from(new Set(items.map((item) => item.category)));
  }),
});
