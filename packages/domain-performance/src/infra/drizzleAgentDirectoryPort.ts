import { agents } from '@reeka-office/domain-agent'
import { and, eq, inArray, isNull } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import type { AgentDirectoryPort, AgentProfile } from '../domain/ports'

export class DrizzleAgentDirectoryPort implements AgentDirectoryPort {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async listProfiles(agentCodes: string[]): Promise<AgentProfile[]> {
    if (agentCodes.length === 0) {
      return []
    }

    const rows = await this.db
      .select({
        agentCode: agents.agentCode,
        joinDate: agents.joinDate,
        designation: agents.designation,
        lastPromotionDate: agents.lastPromotionDate,
      })
      .from(agents)
      .where(inArray(agents.agentCode, agentCodes))

    return rows
      .filter((row): row is Required<Pick<AgentProfile, 'agentCode'>> & Omit<AgentProfile, 'agentCode'> => row.agentCode != null)
      .map((row) => ({
        agentCode: row.agentCode,
        joinDate: row.joinDate,
        designation: row.designation,
        lastPromotionDate: row.lastPromotionDate,
      }))
  }

  async getPromotionProfile(agentCode: string): Promise<AgentProfile | null> {
    const rows = await this.db
      .select({
        agentCode: agents.agentCode,
        designation: agents.designation,
        joinDate: agents.joinDate,
        lastPromotionDate: agents.lastPromotionDate,
      })
      .from(agents)
      .where(and(
        eq(agents.agentCode, agentCode),
        isNull(agents.deletedAt),
      ))
      .limit(1)

    const row = rows[0]
    if (!row?.agentCode) {
      return null
    }

    return {
      agentCode: row.agentCode,
      designation: row.designation,
      joinDate: row.joinDate,
      lastPromotionDate: row.lastPromotionDate,
    }
  }
}
