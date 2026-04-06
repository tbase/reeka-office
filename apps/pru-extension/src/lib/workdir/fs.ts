import { getStoredHandle } from "@/lib/workdir/handle-store"
import { type CachedWorkdirFile } from "@/lib/workdir/types"

function ensureFileSystemAccessSupport() {
  if (typeof window === "undefined" || typeof window.showDirectoryPicker !== "function") {
    throw new Error("当前浏览器不支持选择工作目录")
  }
}

async function getPermissionState(handle: FileSystemDirectoryHandle): Promise<PermissionState> {
  if (typeof handle.queryPermission !== "function") {
    return "granted"
  }

  return handle.queryPermission({ mode: "readwrite" })
}

async function getDirectoryIfExists(parent: FileSystemDirectoryHandle, name: string) {
  try {
    return await parent.getDirectoryHandle(name)
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      return null
    }

    throw error
  }
}

async function getFileIfExists(parent: FileSystemDirectoryHandle, name: string) {
  try {
    return await parent.getFileHandle(name)
  } catch (error) {
    if (error instanceof DOMException && error.name === "NotFoundError") {
      return null
    }

    throw error
  }
}

async function getNestedDirectoryIfExists(parent: FileSystemDirectoryHandle, names: string[]) {
  let current: FileSystemDirectoryHandle | null = parent

  for (const name of names) {
    current = current ? await getDirectoryIfExists(current, name) : null

    if (!current) {
      return null
    }
  }

  return current
}

async function getOrCreateNestedDirectory(parent: FileSystemDirectoryHandle, names: string[]) {
  let current = parent

  for (const name of names) {
    current = await current.getDirectoryHandle(name, { create: true })
  }

  return current
}

async function getWorkdirHandle() {
  ensureFileSystemAccessSupport()

  const handle = await getStoredHandle()

  if (!handle) {
    throw new Error("请先在设置中选择工作目录")
  }

  const permission = await getPermissionState(handle)

  if (permission !== "granted") {
    throw new Error("工作目录权限已失效，请重新选择工作目录")
  }

  return handle
}

async function workdirFileExists(relativePath: string) {
  const handle = await getWorkdirHandle()
  const parts = relativePath.split("/")
  const fileName = parts.at(-1)

  if (parts.length < 2 || !fileName) {
    return false
  }

  const directory = await getNestedDirectoryIfExists(handle, parts.slice(0, -1))

  if (!directory) {
    return false
  }

  return (await getFileIfExists(directory, fileName)) !== null
}

async function writeWorkdirFile(relativePath: string, content: string) {
  const handle = await getWorkdirHandle()
  const parts = relativePath.split("/")
  const fileName = parts.at(-1)

  if (parts.length < 2 || !fileName) {
    throw new Error("输出路径格式不正确")
  }

  const directory = await getOrCreateNestedDirectory(handle, parts.slice(0, -1))
  const fileHandle = await directory.getFileHandle(fileName, { create: true })
  const writable = await fileHandle.createWritable()

  await writable.write(content)
  await writable.close()
}

async function readWorkdirFile(
  directoryHandle: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<CachedWorkdirFile> {
  const parts = relativePath.split("/")
  const fileName = parts.at(-1)

  if (parts.length < 2 || !fileName) {
    throw new Error("缓存文件路径格式不正确")
  }

  let currentDirectory = directoryHandle

  for (const directoryName of parts.slice(1, -1)) {
    currentDirectory = await currentDirectory.getDirectoryHandle(directoryName)
  }

  const fileHandle = await currentDirectory.getFileHandle(fileName)
  const file = await fileHandle.getFile()

  return {
    path: relativePath,
    content: await file.text(),
  }
}

export {
  ensureFileSystemAccessSupport,
  getDirectoryIfExists,
  getFileIfExists,
  getNestedDirectoryIfExists,
  getOrCreateNestedDirectory,
  getPermissionState,
  getWorkdirHandle,
  readWorkdirFile,
  workdirFileExists,
  writeWorkdirFile,
}
