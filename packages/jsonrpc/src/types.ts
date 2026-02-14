import type { z } from "zod";

export type JsonRpcId = string | number;

export type MaybePromise<T> = T | Promise<T>;

export interface RpcMethodOptions<TContext, TInput extends z.ZodType, TOutput> {
  inputSchema?: TInput;
  execute: (params: {
    input: z.infer<TInput>;
    context: TContext;
  }) => MaybePromise<TOutput>;
}

export interface RpcMethod<TContext = unknown> {
  inputSchema?: z.ZodType;
  execute: (params: { input: unknown; context: TContext }) => MaybePromise<unknown>;
}

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params?: unknown;
  id: JsonRpcId;
}

export interface JsonRpcSuccessResponse {
  jsonrpc: "2.0";
  result: unknown;
  id: JsonRpcId;
}

export type RpcValidationIssue = Readonly<{
  path: string;
  message: string;
  code?: string;
}>;

export type RpcValidationErrorData = Readonly<{
  issues: ReadonlyArray<RpcValidationIssue>;
}>;

export type RpcInternalErrorData = Readonly<{
  requestId: string;
  retryable?: boolean;
}>;

export type RpcErrorData = RpcValidationErrorData | RpcInternalErrorData;

export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  error: {
    code: number;
    message: string;
    data?: RpcErrorData;
  };
  id: JsonRpcId | null;
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

export const RpcErrorCode = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
  UNAUTHORIZED: -32001,
  FORBIDDEN: -32002,
  NOT_FOUND: -32003,
  BAD_REQUEST: -32004,
} as const;
