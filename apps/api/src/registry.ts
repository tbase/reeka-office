import { rpc } from "./context";
import {
  getFamilyOfficeResourceDetail,
  listFamilyOfficeResources,
  listServiceCategories,
} from "./rpc/cms";
import { getCurrentUser, updateAvatar } from "./rpc/identity";
import { getMineSummary, listPointRecords, listPointRuleScenes, listPointRules, listRedeemItems, submitRedeem } from "./rpc/points";

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
  getFamilyOfficeResourceDetail,
  listFamilyOfficeResources,
  listServiceCategories,
});

const identityRegistry = rpc.registry({
  getCurrentUser,
  updateAvatar,
});

const pointsRegistry = rpc.registry({
  getMineSummary,
  listRedeemItems,
  listPointRecords,
  listPointRuleScenes,
  listPointRules,
  submitRedeem,
});
export const registry = {
  ...prefixRegistry("cms", cmsRegistry),
  ...prefixRegistry("identity", identityRegistry),
  ...prefixRegistry("points", pointsRegistry),
};

export type APIRegistry = typeof registry;
