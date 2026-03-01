import { rpc } from "./context";
import { listServiceCategories } from "./rpc/cms";
import { getMineSummary, getRedeemDetail, listPointRecords, listPointRuleScenes, listPointRules, listRedeemItems, submitRedeem } from "./rpc/points";
import { bindAgent, getCurrentUser } from "./rpc/user";

type PrefixKeys<P extends string, T> = {
  [K in keyof T as K extends string ? `${P}/${K}` : never]: T[K]
};

function prefixRegistry<P extends string, T extends Record<string, unknown>>(
  prefix: P,
  methods: T,
): PrefixKeys<P, T> {
  const result: Record<string, unknown> = {};

  for (const [key, method] of Object.entries(methods)) {
    result[`${prefix}/${key}`] = method;
  }

  return result as PrefixKeys<P, T>;
}

const cmsRegistry = rpc.registry({
  listServiceCategories,
});

const userRegistry = rpc.registry({
  bindAgent,
  getCurrentUser,
});

const pointRegistry = rpc.registry({
  getMineSummary,
  listRedeemItems,
  listPointRecords,
  listPointRuleScenes,
  listPointRules,
  getRedeemDetail,
  submitRedeem,
});
export const registry = {
  ...prefixRegistry("cms", cmsRegistry),
  ...prefixRegistry("user", userRegistry),
  ...prefixRegistry("point", pointRegistry),
};

export type APIRegistry = typeof registry;