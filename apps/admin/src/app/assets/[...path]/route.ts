import { auth } from "@/lib/auth"
import { getFromCOSRaw } from "@/lib/cos"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`缺少环境变量: ${key}`)
  }
  return value
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  // 鉴权：需要 admin 登录态
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "未登录" }, { status: 401 })
  }

  const { path } = await params
  const key = `assets/${path.join("/")}`

  let bucket: string
  let region: string
  try {
    bucket = getEnv("COS_BUCKET")
    region = getEnv("COS_REGION")
  } catch (err) {
    console.error("[assets] 环境变量缺失:", err)
    return NextResponse.json({ error: "服务器配置错误" }, { status: 500 })
  }

  try {
    console.log("[assets] 读取 COS 文件:", key)
    const { body, contentType, contentLength } = await getFromCOSRaw(bucket, region, key)

    const responseHeaders: Record<string, string> = {
      "Cache-Control": "private, max-age=3600",
    }
    if (contentType) responseHeaders["Content-Type"] = contentType
    if (contentLength !== undefined)
      responseHeaders["Content-Length"] = String(contentLength)

    return new Response(body as BodyInit, {
      status: 200,
      headers: responseHeaders,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes("404") || message.includes("NoSuchKey")) {
      return NextResponse.json({ error: "文件不存在" }, { status: 404 })
    }
    console.error("[assets] 读取 COS 文件失败:", err, key)
    return NextResponse.json({ error: "读取文件失败" }, { status: 500 })
  }
}
