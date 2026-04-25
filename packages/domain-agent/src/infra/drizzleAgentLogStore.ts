import type { DBExecutor } from '../context'
import { agentLogs } from '../schema'
import type { AppendAgentLogInput } from '../agent-log'

export class DrizzleAgentLogStore {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async append(logs: AppendAgentLogInput[]): Promise<void> {
    if (logs.length === 0) {
      return
    }

    await this.db.insert(agentLogs).values(logs.map((log) => ({
      agentCode: log.agentCode,
      category: log.category,
      action: log.action,
      periodYear: log.periodYear ?? null,
      periodMonth: log.periodMonth ?? null,
      source: log.source,
      changes: log.changes,
    })))
  }
}
