import type { CrmApplicationDependencies } from '../application/runtime'
import { normalizeCustomerTypeConfig, type CustomerTypeConfigInput } from '../domain/profile'
import { executeWithCrmRuntime } from '../infra'

export type CreateCustomerTypeConfigInput = CustomerTypeConfigInput
export type UpdateCustomerTypeConfigInput = CustomerTypeConfigInput & { id: number }

const defaultDependencies: CrmApplicationDependencies = {
  executeInTransaction: executeWithCrmRuntime,
  now: () => new Date(),
}

export class CreateCustomerTypeConfigCommand {
  private readonly input: CreateCustomerTypeConfigInput
  private readonly dependencies: CrmApplicationDependencies

  constructor(input: CreateCustomerTypeConfigInput, dependencies: CrmApplicationDependencies = defaultDependencies) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<number> {
    const config = normalizeCustomerTypeConfig(this.input)

    return this.dependencies.executeInTransaction((runtime) =>
      runtime.metadataRepository.createCustomerType(config),
    )
  }
}

export class UpdateCustomerTypeConfigCommand {
  private readonly input: UpdateCustomerTypeConfigInput
  private readonly dependencies: CrmApplicationDependencies

  constructor(input: UpdateCustomerTypeConfigInput, dependencies: CrmApplicationDependencies = defaultDependencies) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<void> {
    const config = normalizeCustomerTypeConfig(this.input)
    if (!config.id) {
      throw new Error('客户类型 ID 无效')
    }

    await this.dependencies.executeInTransaction(async (runtime) => {
      const existing = await runtime.readRepository.getCustomerTypeConfig(config.id!)
      if (!existing) {
        throw new Error('客户类型不存在')
      }

      await runtime.metadataRepository.updateCustomerType({
        ...config,
        id: config.id!,
      })
    })
  }
}
