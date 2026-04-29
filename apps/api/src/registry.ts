import { rpc } from "./context";
import {
  getResourceContent,
  listResourceContents,
} from "./rpc/cms";
import {
  archiveCustomer,
  createCustomer,
  createFollowUp,
  getCustomer,
  getCustomerTypeConfig,
  listCustomers,
  listCustomerTypes,
  updateCustomer,
  updateFollowUp,
} from "./rpc/crm";
import {
  getDashboard,
  getMetricChart,
  getMyPerformanceHistory,
  getMyPerformanceMeta,
  getOrgTree,
  getPromotion,
  listAgentLogs,
  searchAgents,
  getTeamMeta,
  getTeamStats,
  listTeamMembers,
  updateLastPromotionDate,
} from "./rpc/gege";
import { createInviteShareToken, getCurrentUser, updateAvatar, updateNickname } from "./rpc/identity";
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
  getResourceContent,
  listResourceContents,
});

const crmRegistry = rpc.registry({
  archiveCustomer,
  createCustomer,
  createFollowUp,
  getCustomer,
  getCustomerTypeConfig,
  listCustomers,
  listCustomerTypes,
  updateCustomer,
  updateFollowUp,
});

const identityRegistry = rpc.registry({
  createInviteShareToken,
  getCurrentUser,
  updateAvatar,
  updateNickname,
});

const gegeRegistry = rpc.registry({
  getDashboard,
  getMetricChart,
  getMyPerformanceHistory,
  getMyPerformanceMeta,
  getOrgTree,
  getPromotion,
  listAgentLogs,
  searchAgents,
  getTeamMeta,
  getTeamStats,
  listTeamMembers,
  updateLastPromotionDate,
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
  ...prefixRegistry("crm", crmRegistry),
  ...prefixRegistry("gege", gegeRegistry),
  ...prefixRegistry("identity", identityRegistry),
  ...prefixRegistry("points", pointsRegistry),
};

export type APIRegistry = typeof registry;
