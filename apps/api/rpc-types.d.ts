import type { ListServiceCategoriesInput, ListServiceCategoriesOutput } from "@/rpc/cms/listServiceCategories";
import type { GetCurrentUserInput, GetCurrentUserOutput } from "@/rpc/user/getCurrentUser";

type RpcTypeMap = {
  'cms/listServiceCategories': {
    input: ListServiceCategoriesInput;
    output: ListServiceCategoriesOutput;
  };
  'user/getCurrentUser': {
    input: GetCurrentUserInput;
    output: GetCurrentUserOutput;
  }
};

export type RpcMethodName = keyof RpcTypeMap;
export type RpcInput<M extends RpcMethodName> = RpcTypeMap[M]["input"];
export type RpcOutput<M extends RpcMethodName> = RpcTypeMap[M]["output"];
