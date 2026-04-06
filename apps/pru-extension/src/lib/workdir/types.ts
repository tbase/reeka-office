export type WorkdirPermissionState = PermissionState | "missing" | "unsupported"

export type StoredWorkdirState = {
  name: string
  permission: WorkdirPermissionState
  hasHandle: boolean
}

export type CachedWorkdirFile = {
  path: string
  content: string
}
