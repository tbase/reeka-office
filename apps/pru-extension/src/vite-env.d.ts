/// <reference types="vite/client" />

type FileSystemPermissionMode = "read" | "readwrite"

type FileSystemPermissionDescriptor = {
  mode?: FileSystemPermissionMode
}

interface Window {
  showDirectoryPicker?: (options?: FileSystemPermissionDescriptor) => Promise<FileSystemDirectoryHandle>
}

interface FileSystemHandle {
  queryPermission?: (descriptor?: FileSystemPermissionDescriptor) => Promise<PermissionState>
}

/** DOM lib 尚未声明目录异步迭代；Chrome 等已实现。 */
interface FileSystemDirectoryHandle {
  keys(): AsyncIterableIterator<string>
  values(): AsyncIterableIterator<FileSystemHandle>
  entries(): AsyncIterableIterator<[string, FileSystemHandle]>
}
