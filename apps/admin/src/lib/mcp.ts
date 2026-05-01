import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js"
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"

interface HandleStreamableMcpRequestOptions {
  request: Request
  server: McpServer
  authInfo?: AuthInfo
  errorLabel: string
}

export async function handleStreamableMcpRequest({
  request,
  server,
  authInfo,
  errorLabel,
}: HandleStreamableMcpRequestOptions): Promise<Response> {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })

  try {
    await server.connect(transport)
    return await transport.handleRequest(request, { authInfo })
  } catch (err) {
    console.error(`[${errorLabel}] request failed:`, err)
    return jsonRpcError(-32603, "Internal server error", null, 500)
  }
}

export function extractBearerToken(request: Request): string | null {
  const authorization = request.headers.get("authorization") ?? ""
  if (!authorization.startsWith("Bearer ")) {
    return null
  }

  return authorization.slice("Bearer ".length).trim() || null
}

export function jsonToolResult(value: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(value),
      },
    ],
  }
}

export function jsonRpcError(code: number, message: string, id: string | number | null, status: number) {
  return Response.json(
    {
      jsonrpc: "2.0",
      error: {
        code,
        message,
      },
      id,
    },
    { status },
  )
}
