import { isManagementDesignation } from './designation'

export interface AgentHierarchySource {
  agentCode: string
  leaderCode: string | null
  designation: number | null
}

export interface AgentHierarchyEntry {
  agentCode: string
  leaderCode: string
  hierarchy: number
}

export function buildAgentHierarchy(rows: AgentHierarchySource[]): AgentHierarchyEntry[] {
  const agentByCode = new Map(rows.map((row) => [row.agentCode, row]))
  const hierarchyRows: AgentHierarchyEntry[] = []

  for (const agent of rows) {
    let currentAgent = agent
    let hierarchy = 1
    const visiting = new Set([agent.agentCode])

    while (currentAgent.leaderCode) {
      const leader = agentByCode.get(currentAgent.leaderCode)

      if (!leader) {
        throw new Error(`直属上级不存在: ${currentAgent.leaderCode}`)
      }

      if (visiting.has(leader.agentCode)) {
        throw new Error(`代理人层级存在循环: ${[...visiting, leader.agentCode].join(' -> ')}`)
      }

      hierarchyRows.push({
        agentCode: agent.agentCode,
        leaderCode: currentAgent.leaderCode,
        hierarchy,
      })

      visiting.add(leader.agentCode)
      currentAgent = leader

      if (isManagementDesignation(currentAgent.designation)) {
        hierarchy += 1
      }
    }
  }

  return hierarchyRows
}
