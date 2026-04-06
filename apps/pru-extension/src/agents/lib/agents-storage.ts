import {
  getDirectoryIfExists,
  getWorkdirHandle,
  readWorkdirFile,
  workdirFileExists,
  writeWorkdirFile,
} from "@/lib/workdir/fs"
import { buildFetchHour } from "@/lib/workdir/path-utils"
import { type CachedWorkdirFile } from "@/lib/workdir"

function buildAgentsRelativePath(now = new Date()) {
  return `agents/agents_${buildFetchHour(now)}.csv`
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

export { agentsFileExists, buildAgentsRelativePath, loadLatestAgentsCacheFile, writeAgentsFile }
