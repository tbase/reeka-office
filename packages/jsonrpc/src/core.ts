import { z } from "zod";
import type { RpcMethod, RpcMethodOptions, RpcErrorData } from "./types";
import { RpcErrorCode } from "./types";

export type RpcMethodWithTypes<TContext, TInput extends z.ZodType, TOutput> = RpcMethod<TContext> & {
  readonly __inputType: TInput;
  readonly __outputType: TOutput;
};

export function defineFunc<
  TContext = unknown,
  TInput extends z.ZodType = z.ZodVoid,
  TOutput = unknown
>(
  options: RpcMethodOptions<TContext, TInput, TOutput>
): RpcMethodWithTypes<TContext, TInput, TOutput> {
  return {
    inputSchema: options.inputSchema,
    execute: options.execute as RpcMethod<TContext>["execute"],
  } as RpcMethodWithTypes<TContext, TInput, TOutput>;
}

export class RpcError extends Error {
  constructor(
    public code: number,
    message: string,
    public data?: RpcErrorData
  ) {
    super(message);
    this.name = "RpcError";
  }
}

export const createRpcError = {
  unauthorized: (message = "未授权") =>
    new RpcError(RpcErrorCode.UNAUTHORIZED, message),
  forbidden: (message = "权限不足", data?: RpcErrorData) =>
    new RpcError(RpcErrorCode.FORBIDDEN, message, data),
  notFound: (message = "资源不存在", data?: RpcErrorData) =>
    new RpcError(RpcErrorCode.NOT_FOUND, message, data),
  badRequest: (message = "请求参数错误", data?: RpcErrorData) =>
    new RpcError(RpcErrorCode.BAD_REQUEST, message, data),
  internalError: (message = "服务器内部错误", data?: RpcErrorData) =>
    new RpcError(RpcErrorCode.INTERNAL_ERROR, message, data),
};
