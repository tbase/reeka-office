import { uploadToCOS } from "@/lib/cos"
import { NextResponse } from "next/server"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`缺少环境变量: ${key}`)
  }
  return value
}

function getExtension(mimeType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/svg+xml": "svg",
  }
  return map[mimeType] ?? "bin"
}

function generatePath(prefix: string, ext: string): string {
  const now = new Date()
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`
  const rand = Math.random().toString(36).slice(2, 10)
  const segment = prefix ? `${prefix}/` : ""
  return `${segment}${date}/${Date.now()}-${rand}.${ext}`
}

export async function POST(request: Request) {
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "请求体解析失败" }, { status: 400 })
  }

  const file = formData.get("file")
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少 file 字段" }, { status: 400 })
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: `不支持的文件类型: ${file.type}，仅支持 JPEG / PNG / GIF / WebP / SVG` },
      { status: 400 },
    )
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "文件大小超过 10MB 限制" }, { status: 400 })
  }

  let bucket: string
  let region: string
  try {
    bucket = getEnv("COS_BUCKET")
    region = getEnv("COS_REGION")
  } catch (err) {
    console.error("[upload] 环境变量缺失:", err)
    return NextResponse.json({ error: "服务器配置错误" }, { status: 500 })
  }

  const ext = getExtension(file.type)
  const prefix = 'assets'
  const cloudPath = generatePath(prefix, ext)

  let buffer: ArrayBuffer
  try {
    buffer = await file.arrayBuffer()
  } catch {
    return NextResponse.json({ error: "读取文件内容失败" }, { status: 500 })
  }

  try {
    // 管理端上传，openid 传空字符串（官方文档规定的管理端用法）
    await uploadToCOS(bucket, region, cloudPath, buffer, "")
  } catch (err) {
    console.error("[upload] 上传到 COS 失败:", err)
    return NextResponse.json({ error: "上传失败，请稍后重试" }, { status: 500 })
  }

  return NextResponse.json({ path: cloudPath })
}
