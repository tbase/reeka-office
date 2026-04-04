const DB_NAME = "pru-extension-workdir"
const STORE_NAME = "handles"
const HANDLE_KEY = "workdir"

export type WorkdirPermissionState = PermissionState | "missing" | "unsupported"

export type StoredWorkdirState = {
  name: string
  permission: WorkdirPermissionState
  hasHandle: boolean
}

export type CachedSalesMonthFile = {
  path: string
  content: string
}

type SalesMonthParts = {
  year: string
  monthPart: string
}

function ensureFileSystemAccessSupport() {
  if (typeof window === "undefined" || typeof window.showDirectoryPicker !== "function") {
    throw new Error("当前浏览器不支持选择工作目录")
  }
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1)

    request.onerror = () => reject(request.error ?? new Error("打开工作目录存储失败"))
    request.onupgradeneeded = () => {
      const database = request.result

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }
    request.onsuccess = () => resolve(request.result)
  })
}

async function withStore<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase()

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = run(store)

    request.onerror = () => reject(request.error ?? new Error("访问工作目录存储失败"))
    request.onsuccess = () => resolve(request.result)
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => reject(transaction.error ?? new Error("访问工作目录存储失败"))
  })
}

async function getStoredHandle() {
  ensureFileSystemAccessSupport()
  return withStore<FileSystemDirectoryHandle | undefined>("readonly", (store) => store.get(HANDLE_KEY))
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

async function getWorkdirHandle() {
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

function pad(value: number) {
  return String(value).padStart(2, "0")
}

function parseSalesMonthInput(month: string): SalesMonthParts {
  const match = month.match(/^(\d{4})-(\d{2})$/)

  if (!match) {
    throw new Error("月份格式不正确")
  }

  const [, year, monthPart] = match

  return {
    year,
    monthPart,
  }
}

function getPreviousMonth(month: string) {
  const { year, monthPart } = parseSalesMonthInput(month)
  const date = new Date(Number(year), Number(monthPart) - 2, 1)

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`
}

export function buildSalesMonthRelativePath(month: string, now = new Date()) {
  const { year, monthPart } = parseSalesMonthInput(month)

  const fetchHour = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    pad(now.getHours()),
  ].join("")

  return `sales-month/${year}/${monthPart}-${fetchHour}.csv`
}

export async function pickWorkdirHandle() {
  ensureFileSystemAccessSupport()
  const picker = window.showDirectoryPicker

  if (!picker) {
    throw new Error("当前浏览器不支持选择工作目录")
  }

  return picker({ mode: "readwrite" })
}

export async function saveWorkdirHandle(handle: FileSystemDirectoryHandle) {
  ensureFileSystemAccessSupport()
  await withStore<IDBValidKey>("readwrite", (store) => store.put(handle, HANDLE_KEY))
}

export async function clearWorkdirHandle() {
  ensureFileSystemAccessSupport()
  await withStore<undefined>("readwrite", (store) => store.delete(HANDLE_KEY))
}

export async function loadStoredWorkdirState(): Promise<StoredWorkdirState> {
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

export async function salesMonthFileExists(relativePath: string) {
  const handle = await getWorkdirHandle()
  const parts = relativePath.split("/")

  if (parts.length !== 3) {
    return false
  }

  const salesMonthDirectory = await getDirectoryIfExists(handle, parts[0])

  if (!salesMonthDirectory) {
    return false
  }

  const yearDirectory = await getDirectoryIfExists(salesMonthDirectory, parts[1])

  if (!yearDirectory) {
    return false
  }

  return (await getFileIfExists(yearDirectory, parts[2])) !== null
}

export async function writeSalesMonthFile(relativePath: string, content: string) {
  const handle = await getWorkdirHandle()
  const parts = relativePath.split("/")

  if (parts.length !== 3) {
    throw new Error("输出路径格式不正确")
  }

  const salesMonthDirectory = await handle.getDirectoryHandle(parts[0], { create: true })
  const yearDirectory = await salesMonthDirectory.getDirectoryHandle(parts[1], { create: true })
  const fileHandle = await yearDirectory.getFileHandle(parts[2], { create: true })
  const writable = await fileHandle.createWritable()

  await writable.write(content)
  await writable.close()
}

async function readSalesMonthCacheFile(
  salesMonthDirectory: FileSystemDirectoryHandle,
  relativePath: string,
): Promise<CachedSalesMonthFile> {
  const parts = relativePath.split("/")
  const yearDirectory = await salesMonthDirectory.getDirectoryHandle(parts[1])
  const fileHandle = await yearDirectory.getFileHandle(parts[2])
  const file = await fileHandle.getFile()

  return {
    path: relativePath,
    content: await file.text(),
  }
}

async function findLatestSalesMonthFilePath(
  salesMonthDirectory: FileSystemDirectoryHandle,
  yearName: string,
  monthPart?: string,
) {
  const yearDirectory = await getDirectoryIfExists(salesMonthDirectory, yearName)

  if (!yearDirectory) {
    return ""
  }

  let latestPath = ""

  for await (const [fileName, fileHandle] of yearDirectory.entries()) {
    if (fileHandle.kind !== "file" || !fileName.endsWith(".csv")) {
      continue
    }

    if (monthPart && !fileName.startsWith(`${monthPart}-`)) {
      continue
    }

    const relativePath = `sales-month/${yearName}/${fileName}`

    if (relativePath > latestPath) {
      latestPath = relativePath
    }
  }

  return latestPath
}

export async function loadLatestSalesMonthCacheFile(): Promise<CachedSalesMonthFile | null> {
  const handle = await getWorkdirHandle()
  const salesMonthDirectory = await getDirectoryIfExists(handle, "sales-month")

  if (!salesMonthDirectory) {
    return null
  }

  let latestPath = ""

  for await (const [yearName, yearHandle] of salesMonthDirectory.entries()) {
    if (yearHandle.kind !== "directory") {
      continue
    }

    const yearLatestPath = await findLatestSalesMonthFilePath(salesMonthDirectory, yearName)

    if (yearLatestPath > latestPath) {
      latestPath = yearLatestPath
    }
  }

  if (!latestPath) {
    return null
  }

  return readSalesMonthCacheFile(salesMonthDirectory, latestPath)
}

export async function loadSalesMonthCacheFileForMonth(month: string): Promise<CachedSalesMonthFile | null> {
  const handle = await getWorkdirHandle()
  const salesMonthDirectory = await getDirectoryIfExists(handle, "sales-month")

  if (!salesMonthDirectory) {
    return null
  }

  const currentMonth = parseSalesMonthInput(month)
  const currentPath = await findLatestSalesMonthFilePath(
    salesMonthDirectory,
    currentMonth.year,
    currentMonth.monthPart,
  )

  if (currentPath) {
    return readSalesMonthCacheFile(salesMonthDirectory, currentPath)
  }

  const previousMonth = parseSalesMonthInput(getPreviousMonth(month))
  const previousPath = await findLatestSalesMonthFilePath(
    salesMonthDirectory,
    previousMonth.year,
    previousMonth.monthPart,
  )

  if (!previousPath) {
    return null
  }

  return readSalesMonthCacheFile(salesMonthDirectory, previousPath)
}
