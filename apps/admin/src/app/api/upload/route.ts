import { uploadToCOS } from "@/lib/cos"
import { NextResponse } from "next/server"

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"]
const MAX_SIZE_BYTES = 10 * 1024 * 1024 // 10MB
const DIRECTORY_SEGMENT_PATTERN = /^[a-z0-9][a-z0-9-]*$/i

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

function getTenantRootDirectory(): string {
  const tenantCode = getEnv("TENANT_CODE").trim()
  if (!DIRECTORY_SEGMENT_PATTERN.test(tenantCode)) {
    throw new Error("租户编码格式无效")
  }
  return `office-${tenantCode}`
}

function normalizeUploadDirectory(value: FormDataEntryValue | null): string {
  if (typeof value !== "string") {
    return ""
  }

  const directory = value.trim().replace(/^\/+|\/+$/g, "")
  if (!directory) {
    return ""
  }

  const segments = directory.split("/")
  const isValidSegment = segments.every((segment) => DIRECTORY_SEGMENT_PATTERN.test(segment))

  if (!isValidSegment) {
    throw new Error("上传目录格式无效")
  }

  if (segments.length === 1) {
    if (segments[0]?.toLowerCase() === "agent") {
      throw new Error("代理人目录必须包含 agentCode")
    }
    return segments[0]!
  }

  if (segments.length === 2 && segments[0]?.toLowerCase() === "agent") {
    return `agent/${segments[1]}`
  }

  throw new Error("上传目录层级无效")
}

function generateFileName(ext: string): string {
  const rand = Math.random().toString(36).slice(2, 10)
  return `${Date.now()}-${rand}.${ext}`
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
  let tenantRootDirectory: string
  try {
    bucket = getEnv("COS_BUCKET")
    region = getEnv("COS_REGION")
    tenantRootDirectory = getTenantRootDirectory()
  } catch (err) {
    console.error("[upload] 环境变量缺失:", err)
    return NextResponse.json({ error: "服务器配置错误" }, { status: 500 })
  }

  const ext = getExtension(file.type)
  let uploadDirectory: string
  try {
    uploadDirectory = normalizeUploadDirectory(formData.get("directory"))
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "上传目录无效" },
      { status: 400 },
    )
  }

  const cloudPath = [tenantRootDirectory, uploadDirectory, generateFileName(ext)]
    .filter(Boolean)
    .join("/")

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
