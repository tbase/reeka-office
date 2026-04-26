import type { CrmApplicationDependencies } from '../application/runtime'
import { normalizePositiveId, parseFollowedAt } from '../domain/customer'
import { normalizeRequiredText } from '../domain/profile'
import { executeWithCrmRuntime } from '../infra'

export interface UpdateFollowUpInput {
  agentId: number
  customerId: number
  followUpId: number
  statusId: number
  followedAt?: Date | string | null
  content: string
}

const defaultDependencies: CrmApplicationDependencies = {
  executeInTransaction: executeWithCrmRuntime,
  now: () => new Date(),
}

export class UpdateFollowUpCommand {
  private readonly input: UpdateFollowUpInput
  private readonly dependencies: CrmApplicationDependencies

  constructor(input: UpdateFollowUpInput, dependencies: CrmApplicationDependencies = defaultDependencies) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<void> {
    const agentId = normalizePositiveId(this.input.agentId, '代理人 ID 无效')
    const customerId = normalizePositiveId(this.input.customerId, '客户 ID 无效')
    const followUpId = normalizePositiveId(this.input.followUpId, '跟进记录 ID 无效')
    const statusId = normalizePositiveId(this.input.statusId, '跟进状态 ID 无效')
    const followedAt = parseFollowedAt(this.input.followedAt)
    const content = normalizeRequiredText(this.input.content, '跟进内容不能为空')

    await this.dependencies.executeInTransaction(async (runtime) => {
      const customer = await runtime.readRepository.getOwnedCustomer({ agentId, customerId })
      if (!customer) {
        throw new Error('客户不存在')
      }

      const status = await runtime.readRepository.getEnabledFollowUpStatus({
        customerTypeId: customer.customerTypeId,
        statusId,
      })
      if (!status) {
        throw new Error('跟进状态不可用')
      }

      const updated = await runtime.customerRepository.updateFollowUp({
        agentId,
        customerId,
        followUpId,
        statusId,
        statusNameSnapshot: status.name,
        followedAt,
        content,
      })
      if (!updated) {
        throw new Error('跟进记录不存在')
      }
    })
  }
}
