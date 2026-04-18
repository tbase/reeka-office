import { auth } from "@/lib/auth";
import {
  getAuthRequestDebugInfo,
  getAuthResponseDebugInfo,
  logAuthDebug,
} from "@/lib/auth-debug";
import { toNextJsHandler } from "better-auth/next-js";

export const runtime = "nodejs";

const { GET: rawGET, POST: rawPOST } = toNextJsHandler(auth) as {
  GET: (request: Request, context: unknown) => Promise<Response>;
  POST: (request: Request, context: unknown) => Promise<Response>;
};

async function handleWithDebug(
  method: "GET" | "POST",
  request: Request,
  context: unknown,
  handler: (request: Request, context: unknown) => Promise<Response>,
) {
  logAuthDebug(`route.${method}.request`, {
    url: request.url,
    ...getAuthRequestDebugInfo(request.headers),
  });

  const response = await handler(request, context);

  logAuthDebug(`route.${method}.response`, {
    url: request.url,
    status: response.status,
    ...getAuthResponseDebugInfo(response.headers),
  });

  return response;
}

export function GET(request: Request, context: unknown) {
  return handleWithDebug("GET", request, context, rawGET);
}

export function POST(request: Request, context: unknown) {
  return handleWithDebug("POST", request, context, rawPOST);
}
