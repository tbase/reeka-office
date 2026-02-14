import type {
  RpcMethod,
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcErrorResponse,
  RpcErrorData,
  JsonRpcId,
} from "./types";
import { RpcErrorCode } from "./types";
import { RpcError } from "./core";

export interface HandleRpcOptions<TContext> {
  createContext?: (req: Request) => Promise<TContext> | TContext;
}

function createErrorResponse(
  code: number,
  message: string,
  id: JsonRpcId | null,
  data?: RpcErrorData
): JsonRpcErrorResponse {
  return {
    jsonrpc: "2.0",
    error: { code, message, data },
    id,
  };
}

function createInternalErrorResponse(
  id: JsonRpcId | null,
  requestId: string
): JsonRpcErrorResponse {
  return createErrorResponse(
    RpcErrorCode.INTERNAL_ERROR,
    "服务器内部错误",
    id,
    { requestId }
  );
}

function buildErrorResponses(
  body: unknown,
  createResponse: (id: JsonRpcId | null) => JsonRpcErrorResponse
): JsonRpcErrorResponse | JsonRpcErrorResponse[] {
  if (Array.isArray(body)) {
    if (body.length === 0) return createResponse(null);
    return body.map((request) => {
      if (isValidRequest(request)) {
        return createResponse((request as JsonRpcRequest).id);
      }
      return createResponse(null);
    });
  }

  if (isValidRequest(body)) {
    return createResponse((body as JsonRpcRequest).id);
  }

  return createResponse(null);
}

function isValidRequest(body: unknown): boolean {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;

  const request = body as Record<string, unknown>;
  if (request.jsonrpc !== "2.0") return false;
  if (typeof request.method !== "string" || request.method.trim().length === 0) return false;
  if (!Object.prototype.hasOwnProperty.call(request, "id")) return false;

  const id = request.id;
  if (id === null) return false;
  if (typeof id !== "string" && typeof id !== "number") return false;

  return true;
}

async function handleRequest<TContext>(
  registry: Record<string, RpcMethod<TContext>>,
  request: JsonRpcRequest,
  context: TContext
): Promise<JsonRpcResponse> {
  const { method: methodName, params, id } = request;

  const method = registry[methodName];
  if (!method) {
    return createErrorResponse(
      RpcErrorCode.METHOD_NOT_FOUND,
      `方法不存在: ${methodName}`,
      id
    );
  }

  let validatedInput: unknown = params ?? {};
  if (method.inputSchema) {
    const parseResult = method.inputSchema.safeParse(params);
    if (!parseResult.success) {
      const issues = parseResult.error.issues.map((issue) => ({
        path: issue.path.map((segment) => String(segment)).join("."),
        message: issue.message,
        code: issue.code,
      }));
      return createErrorResponse(
        RpcErrorCode.INVALID_PARAMS,
        "参数验证失败",
        id,
        { issues }
      );
    }
    validatedInput = parseResult.data;
  }

  try {
    const result = await method.execute({
      input: validatedInput,
      context,
    });

    return {
      jsonrpc: "2.0",
      result,
      id,
    };
  } catch (error) {
    if (error instanceof RpcError) {
      return createErrorResponse(error.code, error.message, id, error.data);
    }

    const requestId = crypto.randomUUID();
    console.error(`RPC 方法执行错误 [${methodName}] [${requestId}]:`, error);

    return createInternalErrorResponse(id, requestId);
  }
}

export const handleRPC = <TContext = undefined>(
  registry: Record<string, RpcMethod<TContext>>,
  options: HandleRpcOptions<TContext> = {}
) => async (req: Request) => {
  let context: TContext;
  try {
    context = options.createContext
      ? await options.createContext(req)
      : (undefined as TContext);
  } catch (error) {
    if (error instanceof RpcError) {
      return Response.json(
        createErrorResponse(error.code, error.message, null, error.data),
        { status: 200 }
      );
    }

    const requestId = crypto.randomUUID();
    console.error(`RPC 上下文构建错误 [${requestId}]:`, error);
    return Response.json(createInternalErrorResponse(null, requestId), { status: 200 });
  }

  let body: JsonRpcRequest | JsonRpcRequest[];
  try {
    body = await req.json();
  } catch {
    return Response.json(
      createErrorResponse(RpcErrorCode.PARSE_ERROR, "JSON 解析错误", null),
      { status: 200 }
    );
  }

  const createInvalidRequestResponse = () =>
    createErrorResponse(RpcErrorCode.INVALID_REQUEST, "无效的 JSON-RPC 请求", null);

  try {
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return Response.json(createInvalidRequestResponse(), { status: 200 });
      }
      const responses = await Promise.all(
        body.map((request) => {
          if (!isValidRequest(request)) {
            return createInvalidRequestResponse();
          }

          return handleRequest(registry, request, context);
        })
      );
      return Response.json(responses);
    }

    if (!isValidRequest(body)) {
      return Response.json(createInvalidRequestResponse(), { status: 200 });
    }

    const response = await handleRequest(registry, body, context);
    return Response.json(response);
  } catch (error) {
    if (error instanceof RpcError) {
      const errorResponse = buildErrorResponses(
        body,
        (id) => createErrorResponse(error.code, error.message, id, error.data)
      );
      return Response.json(errorResponse, { status: 200 });
    }

    const requestId = crypto.randomUUID();
    console.error(`RPC 路由处理错误 [${requestId}]:`, error);

    const errorResponse = buildErrorResponses(
      body,
      (id) => createInternalErrorResponse(id, requestId)
    );
    return Response.json(errorResponse, { status: 200 });
  }
};
