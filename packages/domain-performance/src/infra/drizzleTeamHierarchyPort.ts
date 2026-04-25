import { agentHierarchy } from '@reeka-office/domain-agent/schema'
import { and, eq, gt } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import type { TeamHierarchyPort, TeamScope } from '../domain/ports'

export class DrizzleTeamHierarchyPort implements TeamHierarchyPort {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async listMemberCodes(leaderCode: string, scope: TeamScope): Promise<string[]> {
    const rows = await this.db
      .select({
        agentCode: agentHierarchy.agentCode,
      })
      .from(agentHierarchy)
      .where(and(
        eq(agentHierarchy.leaderCode, leaderCode),
        scope === 'direct'
          ? eq(agentHierarchy.hierarchy, 1)
          : gt(agentHierarchy.hierarchy, 0),
      ))

    return rows
      .map((row) => row.agentCode)
      .filter((value): value is string => Boolean(value))
  }
}
