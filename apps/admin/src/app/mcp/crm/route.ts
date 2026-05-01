import { handleCrmMcpRequest } from "./server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  return handleCrmMcpRequest(request)
}

export async function POST(request: Request) {
  return handleCrmMcpRequest(request)
}

export async function DELETE(request: Request) {
  return handleCrmMcpRequest(request)
}
