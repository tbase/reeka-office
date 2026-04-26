import type { CrmRuntime } from '../application/runtime'
import { getDb, withTransaction, type DBExecutor } from '../context'
import { DrizzleCrmRepository } from './drizzleCrmRepository'

export function createCrmRuntime(db: DBExecutor): CrmRuntime {
  const repository = new DrizzleCrmRepository(db)

  return {
    metadataRepository: repository,
    customerRepository: repository,
    readRepository: repository,
  }
}

export function createDefaultCrmRuntime(): CrmRuntime {
  return createCrmRuntime(getDb())
}

export function executeWithCrmRuntime<T>(work: (runtime: CrmRuntime) => Promise<T>): Promise<T> {
  return withTransaction((tx) => work(createCrmRuntime(tx)))
}
