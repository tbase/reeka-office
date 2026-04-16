import {
  getDirectoryIfExists,
  getWorkdirHandle,
  readWorkdirFile,
  workdirFileExists,
  writeWorkdirFile,
} from "@/lib/workdir/fs"
import { buildFetchHour } from "@/lib/workdir/path-utils"
import { type CachedWorkdirFile } from "@/lib/workdir"

type AgentFileOption = {
  path: string
  label: string
}

function buildAgentsRelativePath(now = new Date()) {
  return `agents/agents_${buildFetchHour(now)}.csv`
}

function formatAgentFileLabel(path: string) {
  const match = path.match(/^agents\/agents_(\d{4})(\d{2})(\d{2})(\d{2})\.csv$/)

  if (!match) {
    return path.split("/").at(-1) ?? path
  }

  const [, year, month, day, hour] = match

  return `${year}-${month}-${day} ${hour}:00`
}

async function findLatestAgentsFilePath(agentsDirectory: FileSystemDirectoryHandle) {
  let latestPath = ""

  for await (const [fileName, fileHandle] of agentsDirectory.entries()) {
    if (fileHandle.kind !== "file" || !fileName.endsWith(".csv") || !fileName.startsWith("agents_")) {
      continue
    }

    const relativePath = `agents/${fileName}`

    if (relativePath > latestPath) {
      latestPath = relativePath
    }
  }

  return latestPath
}

async function agentsFileExists(relativePath: string) {
  return workdirFileExists(relativePath)
}

async function writeAgentsFile(relativePath: string, content: string) {
  await writeWorkdirFile(relativePath, content)
}

async function loadAgentsFile(relativePath: string): Promise<CachedWorkdirFile> {
  const handle = await getWorkdirHandle()
  const agentsDirectory = await getDirectoryIfExists(handle, "agents")

  if (!agentsDirectory) {
    throw new Error("未找到代理人信息目录")
  }

  return readWorkdirFile(agentsDirectory, relativePath)
}

async function loadLatestAgentsCacheFile(): Promise<CachedWorkdirFile | null> {
  const handle = await getWorkdirHandle()
  const agentsDirectory = await getDirectoryIfExists(handle, "agents")

  if (!agentsDirectory) {
    return null
  }

  const latestPath = await findLatestAgentsFilePath(agentsDirectory)

  if (!latestPath) {
    return null
  }

  return readWorkdirFile(agentsDirectory, latestPath)
}

async function listLatestAgentFiles(limit = 10): Promise<AgentFileOption[]> {
  const handle = await getWorkdirHandle()
  const agentsDirectory = await getDirectoryIfExists(handle, "agents")

  if (!agentsDirectory) {
    return []
  }

  const paths: string[] = []

  for await (const [fileName, fileHandle] of agentsDirectory.entries()) {
    if (fileHandle.kind !== "file" || !fileName.endsWith(".csv") || !fileName.startsWith("agents_")) {
      continue
    }

    paths.push(`agents/${fileName}`)
  }

  return paths
    .sort((left, right) => right.localeCompare(left))
    .slice(0, limit)
    .map((path) => ({
      path,
      label: formatAgentFileLabel(path),
    }))
}

export {
  agentsFileExists,
  buildAgentsRelativePath,
  listLatestAgentFiles,
  loadAgentsFile,
  loadLatestAgentsCacheFile,
  writeAgentsFile,
}
export type { AgentFileOption }
