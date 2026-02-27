import type { ListServiceCategoriesInput, ListServiceCategoriesOutput } from "@/rpc/cms/listServiceCategories";
import type { GetMineSummaryInput, GetMineSummaryOutput } from "@/rpc/points/getMineSummary";
import type { GetRedeemDetailInput, GetRedeemDetailOutput } from "@/rpc/points/getRedeemDetail";
import type { ListPointRecordsInput, ListPointRecordsOutput } from "@/rpc/points/listPointRecords";
import type { ListPointRulesInput, ListPointRulesOutput } from "@/rpc/points/listPointRules";
import type { ListPointRuleScenesInput, ListPointRuleScenesOutput } from "@/rpc/points/listPointRuleScenes";
import type { ListRedeemItemsInput, ListRedeemItemsOutput } from "@/rpc/points/listRedeemItems";
import type { SubmitRedeemInput, SubmitRedeemOutput } from "@/rpc/points/submitRedeem";
import type { GetCurrentUserInput, GetCurrentUserOutput } from "@/rpc/user/getCurrentUser";

export type BindAgentInput = {
  token: string;
};

export type BindAgentOutput = {
  agentCode: string;
  agentName: string;
};

type RpcTypeMap = {
  'cms/listServiceCategories': {
    input: ListServiceCategoriesInput;
    output: ListServiceCategoriesOutput;
  };
  'user/getCurrentUser': {
    input: GetCurrentUserInput;
    output: GetCurrentUserOutput;
  };
  'user/bindAgent': {
    input: BindAgentInput;
    output: BindAgentOutput;
  };
  'point/getMineSummary': {
    input: GetMineSummaryInput;
    output: GetMineSummaryOutput;
  };
  'point/listRedeemItems': {
    input: ListRedeemItemsInput;
    output: ListRedeemItemsOutput;
  };
  'point/listPointRecords': {
    input: ListPointRecordsInput;
    output: ListPointRecordsOutput;
  };
  'point/listPointRuleScenes': {
    input: ListPointRuleScenesInput;
    output: ListPointRuleScenesOutput;
  };
  'point/listPointRules': {
    input: ListPointRulesInput;
    output: ListPointRulesOutput;
  };
  'point/getRedeemDetail': {
    input: GetRedeemDetailInput;
    output: GetRedeemDetailOutput;
  };
  'point/submitRedeem': {
    input: SubmitRedeemInput;
    output: SubmitRedeemOutput;
  }
};

export type RpcMethodName = keyof RpcTypeMap;
export type RpcInput<M extends RpcMethodName> = RpcTypeMap[M]["input"];
export type RpcOutput<M extends RpcMethodName> = RpcTypeMap[M]["output"];
