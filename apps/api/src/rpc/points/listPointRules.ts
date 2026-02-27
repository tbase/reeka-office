import { ListPointItemsQuery } from "@reeka-office/domain-point";
import { defineFunc } from "@reeka-office/jsonrpc";
import { z } from "zod";

import type { RequestContext } from "./shared";

const inputSchema = z.void();

export type ListPointRulesInput = z.infer<typeof inputSchema>;
export type ListPointRulesOutput = Array<{
  task: string;
  score: string;
  frequency: string;
}>;

export const listPointRules = defineFunc<RequestContext, typeof inputSchema, ListPointRulesOutput>({
  inputSchema,
  execute: async () => {
    const items = await new ListPointItemsQuery().query();

    return items.map((item) => ({
      task: item.name,
      score: item.pointAmount !== null ? `+${item.pointAmount}` : "按规则计算",
      frequency:
        item.annualLimit === null || item.annualLimit < 0
          ? "不限次数"
          : `年度上限 ${item.annualLimit} 次`,
    }));
  },
});
