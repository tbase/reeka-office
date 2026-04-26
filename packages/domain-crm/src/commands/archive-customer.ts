import type { CrmApplicationDependencies } from '../application/runtime'
import { normalizePositiveId } from '../domain/customer'
import { executeWithCrmRuntime } from '../infra'

export interface ArchiveCustomerInput {
  agentId: number
  customerId: number
}

const defaultDependencies: CrmApplicationDependencies = {
  executeInTransaction: executeWithCrmRuntime,
  now: () => new Date(),
}

export class ArchiveCustomerCommand {
  private readonly input: ArchiveCustomerInput
  private readonly dependencies: CrmApplicationDependencies

  constructor(input: ArchiveCustomerInput, dependencies: CrmApplicationDependencies = defaultDependencies) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<boolean> {
    const agentId = normalizePositiveId(this.input.agentId, '代理人 ID 无效')
    const customerId = normalizePositiveId(this.input.customerId, '客户 ID 无效')
    const archivedAt = this.dependencies.now()

    return this.dependencies.executeInTransaction((runtime) =>
      runtime.customerRepository.archiveCustomer({
        agentId,
        customerId,
        archivedAt,
      }),
    )
  }
}
