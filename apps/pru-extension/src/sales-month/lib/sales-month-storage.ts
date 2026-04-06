import {
  getDirectoryIfExists,
  getWorkdirHandle,
  readWorkdirFile,
  workdirFileExists,
  writeWorkdirFile,
} from "@/lib/workdir/fs"
import { buildFetchHour, pad } from "@/lib/workdir/path-utils"
import { type CachedWorkdirFile } from "@/lib/workdir"

type SalesMonthParts = {
  year: string
  monthPart: string
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

function buildSalesMonthRelativePath(month: string, now = new Date()) {
  const { year, monthPart } = parseSalesMonthInput(month)

  return `sales-month/${year}/${monthPart}-${buildFetchHour(now)}.csv`
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

async function salesMonthFileExists(relativePath: string) {
  return workdirFileExists(relativePath)
}

async function writeSalesMonthFile(relativePath: string, content: string) {
  await writeWorkdirFile(relativePath, content)
}

async function loadLatestSalesMonthCacheFile(): Promise<CachedWorkdirFile | null> {
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

  return readWorkdirFile(salesMonthDirectory, latestPath)
}

async function loadSalesMonthCacheFileForMonth(month: string): Promise<CachedWorkdirFile | null> {
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
    return readWorkdirFile(salesMonthDirectory, currentPath)
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

  return readWorkdirFile(salesMonthDirectory, previousPath)
}

export {
  buildSalesMonthRelativePath,
  loadLatestSalesMonthCacheFile,
  loadSalesMonthCacheFileForMonth,
  salesMonthFileExists,
  writeSalesMonthFile,
}
