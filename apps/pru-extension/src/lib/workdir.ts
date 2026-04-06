import { clearStoredHandle, getStoredHandle, saveStoredHandle } from "@/lib/workdir/handle-store"
import { ensureFileSystemAccessSupport, getPermissionState } from "@/lib/workdir/fs"

import { type CachedWorkdirFile, type StoredWorkdirState, type WorkdirPermissionState } from "@/lib/workdir/types"

async function pickWorkdirHandle() {
  ensureFileSystemAccessSupport()
  const picker = window.showDirectoryPicker

  if (!picker) {
    throw new Error("当前浏览器不支持选择工作目录")
  }

  return picker({ mode: "readwrite" })
}

async function saveWorkdirHandle(handle: FileSystemDirectoryHandle) {
  ensureFileSystemAccessSupport()
  await saveStoredHandle(handle)
}

async function clearWorkdirHandle() {
  ensureFileSystemAccessSupport()
  await clearStoredHandle()
}

async function loadStoredWorkdirState(): Promise<StoredWorkdirState> {
  ensureFileSystemAccessSupport()

  const handle = await getStoredHandle()

  if (!handle) {
    return {
      name: "",
      permission: "missing",
      hasHandle: false,
    }
  }

  return {
    name: handle.name,
    permission: await getPermissionState(handle),
    hasHandle: true,
  }
}

export { clearWorkdirHandle, loadStoredWorkdirState, pickWorkdirHandle, saveWorkdirHandle }
export type { CachedWorkdirFile, StoredWorkdirState, WorkdirPermissionState }
