import type { UploadFile } from 'tdesign-miniprogram/upload/type'
import { getCloudInstance } from './cloud'
import { randomID } from './random-id'
import { getActiveTenantCode } from './tenant-session'

const DIRECTORY_SEGMENT_PATTERN = /^[a-z0-9][a-z0-9-]*$/i

function getFileExtension(path: string) {
  const matched = /\.([a-z0-9]+)(?:\?|$)/i.exec(path)
  return matched ? matched[1].toLowerCase() : 'jpg'
}

function getTenantRootDirectory(): string {
  const tenantCode = getActiveTenantCode()?.trim()
  if (!tenantCode) {
    throw new Error('缺少租户编码')
  }
  if (!DIRECTORY_SEGMENT_PATTERN.test(tenantCode)) {
    throw new Error('租户编码格式无效')
  }
  return `office-${tenantCode}`
}

function normalizeUploadDirectory(directory: string): string {
  const normalized = directory.trim().replace(/^\/+|\/+$/g, '')
  if (!normalized) {
    return ''
  }

  const segments = normalized.split('/')
  const isValidSegment = segments.every(segment => DIRECTORY_SEGMENT_PATTERN.test(segment))
  if (!isValidSegment) {
    throw new Error('上传目录格式无效')
  }

  if (segments.length === 1) {
    if (segments[0]?.toLowerCase() === 'agent') {
      throw new Error('代理人目录必须包含 agentCode')
    }
    return segments[0]!
  }

  if (segments.length === 2 && segments[0]?.toLowerCase() === 'agent') {
    return `agent/${segments[1]}`
  }

  throw new Error('上传目录层级无效')
}

export async function uploadFile(file: UploadFile | string, directory: string) {
  const filePath = typeof file === 'string' ? file : file.url
  const ext = getFileExtension(filePath)
  const fileID = randomID()
  const tenantRootDirectory = getTenantRootDirectory()
  const uploadDirectory = normalizeUploadDirectory(directory)
  const cloudPath = [tenantRootDirectory, uploadDirectory, `${fileID}.${ext}`]
    .filter(Boolean)
    .join('/')
  const cloudInstance = await getCloudInstance()
  const result = await cloudInstance.uploadFile({
    cloudPath,
    filePath,
  })

  console.log('uploadFile', result)
  return cloudPath
}
