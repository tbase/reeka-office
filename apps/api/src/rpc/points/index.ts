import type { RpcMethod } from "@reeka-office/jsonrpc";
import type { RequestContext } from "./shared";

import { getMineSummary } from "./getMineSummary";
import { getRedeemDetail } from "./getRedeemDetail";
import { listPointRecords } from "./listPointRecords";
import { listPointRules } from "./listPointRules";
import { listPointRuleScenes } from "./listPointRuleScenes";
import { listRedeemItems } from "./listRedeemItems";
import { submitRedeem } from "./submitRedeem";

export const pointsRegistry: Record<string, RpcMethod<RequestContext>> = {
  getMineSummary,
  listRedeemItems,
  listPointRecords,
  listPointRuleScenes,
  listPointRules,
  getRedeemDetail,
  submitRedeem,
};
