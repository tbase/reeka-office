import type { ListServiceCategoriesInput, ListServiceCategoriesOutput } from "@/rpc/cms/listServiceCategories";
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
};

export type RpcMethodName = keyof RpcTypeMap;
export type RpcInput<M extends RpcMethodName> = RpcTypeMap[M]["input"];
export type RpcOutput<M extends RpcMethodName> = RpcTypeMap[M]["output"];
