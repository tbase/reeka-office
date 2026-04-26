export interface RecentViewedAgent {
  agentCode: string
  name: string
  designationName: string | null
}

const RECENT_VIEWED_AGENTS_KEY = 'gege:recent-viewed-agents'
const MAX_HISTORY_SIZE = 8

function isRecentViewedAgent(value: unknown): value is RecentViewedAgent {
  if (!value || typeof value !== 'object') {
    return false
  }

  const candidate = value as Partial<RecentViewedAgent>

  return typeof candidate.agentCode === 'string'
    && typeof candidate.name === 'string'
    && (candidate.designationName == null || typeof candidate.designationName === 'string')
}

function uniqueBy<T>(
  items: T[],
  getKey: (item: T) => string,
): T[] {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = getKey(item)

    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

export function getRecentViewedAgents(): RecentViewedAgent[] {
  try {
    const value = wx.getStorageSync(RECENT_VIEWED_AGENTS_KEY)

    if (!Array.isArray(value)) {
      return []
    }

    return uniqueBy(
      value.filter(isRecentViewedAgent),
      item => item.agentCode.toUpperCase(),
    ).slice(0, MAX_HISTORY_SIZE)
  } catch {
    return []
  }
}

export function pushRecentViewedAgent(agent: RecentViewedAgent): RecentViewedAgent[] {
  const normalizedAgentCode = agent.agentCode.trim().toUpperCase()

  if (!normalizedAgentCode) {
    return getRecentViewedAgents()
  }

  const nextItems = uniqueBy(
    [{
      ...agent,
      agentCode: normalizedAgentCode,
      name: agent.name.trim(),
      designationName: agent.designationName?.trim() ?? null,
    }, ...getRecentViewedAgents()],
    item => item.agentCode.toUpperCase(),
  ).slice(0, MAX_HISTORY_SIZE)

  try {
    wx.setStorageSync(RECENT_VIEWED_AGENTS_KEY, nextItems)
  } catch {
    return getRecentViewedAgents()
  }

  return nextItems
}

export function removeRecentViewedAgent(agentCode: string): RecentViewedAgent[] {
  const normalizedAgentCode = agentCode.trim().toUpperCase()

  if (!normalizedAgentCode) {
    return getRecentViewedAgents()
  }

  const nextItems = getRecentViewedAgents()
    .filter(item => item.agentCode.toUpperCase() !== normalizedAgentCode)

  try {
    wx.setStorageSync(RECENT_VIEWED_AGENTS_KEY, nextItems)
  } catch {
    return getRecentViewedAgents()
  }

  return nextItems
}

export function clearRecentViewedAgents(): RecentViewedAgent[] {
  try {
    wx.removeStorageSync(RECENT_VIEWED_AGENTS_KEY)
  } catch {
    return getRecentViewedAgents()
  }

  return []
}
