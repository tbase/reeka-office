import type { CrmApplicationDependencies } from '../application/runtime'
import { normalizePositiveId, parseFollowedAt } from '../domain/customer'
import { normalizeRequiredText } from '../domain/profile'
import { executeWithCrmRuntime } from '../infra'

export interface CreateFollowUpInput {
  agentId: number
  customerId: number
  statusId: number
  followedAt?: Date | string | null
  content: string
}

const defaultDependencies: CrmApplicationDependencies = {
  executeInTransaction: executeWithCrmRuntime,
  now: () => new Date(),
}

export class CreateFollowUpCommand {
  private readonly input: CreateFollowUpInput
  private readonly dependencies: CrmApplicationDependencies

  constructor(input: CreateFollowUpInput, dependencies: CrmApplicationDependencies = defaultDependencies) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<number> {
    const agentId = normalizePositiveId(this.input.agentId, '代理人 ID 无效')
    const customerId = normalizePositiveId(this.input.customerId, '客户 ID 无效')
    const statusId = normalizePositiveId(this.input.statusId, '跟进状态 ID 无效')
    const followedAt = parseFollowedAt(this.input.followedAt)
    const content = normalizeRequiredText(this.input.content, '跟进内容不能为空')

    return this.dependencies.executeInTransaction(async (runtime) => {
      const customer = await runtime.readRepository.getOwnedCustomer({ agentId, customerId })
      if (!customer) {
        throw new Error('客户不存在')
      }

      const customerType = await runtime.readRepository.getCustomerTypeConfig(customer.customerTypeId)
      const status = customerType?.followUpStatuses.find((item) => item.id === statusId && item.enabled) ?? null
      if (!status) {
        throw new Error('跟进状态不可用')
      }

      return runtime.customerRepository.createFollowUp({
        agentId,
        customerId,
        customerTypeId: customer.customerTypeId,
        statusId,
        statusNameSnapshot: status.name,
        followedAt,
        content,
      })
    })
  }
}
