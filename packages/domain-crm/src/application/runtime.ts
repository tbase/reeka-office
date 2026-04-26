import type { CrmCustomerRepository, CrmMetadataRepository, CrmReadRepository } from '../domain/repositories'

export interface CrmRuntime {
  metadataRepository: CrmMetadataRepository
  customerRepository: CrmCustomerRepository
  readRepository: CrmReadRepository
}

export interface CrmApplicationDependencies {
  executeInTransaction<T>(work: (runtime: CrmRuntime) => Promise<T>): Promise<T>
  now(): Date
}
