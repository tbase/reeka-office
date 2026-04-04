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
