import type { RpcMethodWithTypes } from "@reeka-office/jsonrpc";
import type { z } from "zod";
import type { APIRegistry } from "./src/registry";

type ExtractRpcTypeMap<T> = {
  [K in keyof T]: T[K] extends RpcMethodWithTypes<any, infer TInput extends z.ZodType, infer TOutput>
  ? { input: z.infer<TInput>; output: TOutput }
  : never
};

export type RpcTypeMap = ExtractRpcTypeMap<APIRegistry>;
export type RpcMethodName = keyof RpcTypeMap;
export type RpcInput<M extends RpcMethodName> = RpcTypeMap[M]["input"];
export type RpcOutput<M extends RpcMethodName> = RpcTypeMap[M]["output"];
