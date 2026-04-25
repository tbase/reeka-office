import { isNull } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import type { TeamHierarchyRepository } from '../domain/repositories'
import type { AgentHierarchyEntry, AgentHierarchySource } from '../domain/teamHierarchy'
import { agentHierarchy, agents } from '../schema'

export class DrizzleTeamHierarchyRepository implements TeamHierarchyRepository {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async listSources(): Promise<AgentHierarchySource[]> {
    const rows = await this.db
      .select({
        agentCode: agents.agentCode,
        leaderCode: agents.leaderCode,
        designation: agents.designation,
      })
      .from(agents)
      .where(isNull(agents.deletedAt))

    return rows.filter((row): row is typeof row & { agentCode: string } => row.agentCode != null)
  }

  async replace(rows: AgentHierarchyEntry[]): Promise<void> {
    await this.db.delete(agentHierarchy)

    if (rows.length > 0) {
      await this.db.insert(agentHierarchy).values(rows)
    }
  }
}
