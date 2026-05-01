import type { CrmApplicationDependencies } from '../application/runtime'
import { normalizePositiveId } from '../domain/customer'
import { executeWithCrmRuntime } from '../infra'

export interface MarkFollowUpsAnalyzedInput {
  customerId: number
  followUpIds: number[]
}

const defaultDependencies: CrmApplicationDependencies = {
  executeInTransaction: executeWithCrmRuntime,
  now: () => new Date(),
}

export class MarkFollowUpsAnalyzedCommand {
  private readonly input: MarkFollowUpsAnalyzedInput
  private readonly dependencies: CrmApplicationDependencies

  constructor(input: MarkFollowUpsAnalyzedInput, dependencies: CrmApplicationDependencies = defaultDependencies) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<void> {
    const customerId = normalizePositiveId(this.input.customerId, '客户 ID 无效')
    const followUpIds = [...new Set(this.input.followUpIds.map(id => normalizePositiveId(id, '跟进记录 ID 无效')))]
    if (followUpIds.length === 0) {
      throw new Error('跟进记录不能为空')
    }

    await this.dependencies.executeInTransaction(async (runtime) => {
      const customer = await runtime.readRepository.getCustomerDetailById(customerId)
      if (!customer) {
        throw new Error('客户不存在')
      }

      const existingIds = new Set(customer.followUps.map(followUp => followUp.id))
      const missingIds = followUpIds.filter(id => !existingIds.has(id))
      if (missingIds.length > 0) {
        throw new Error(`跟进记录不存在或不属于该客户: ${missingIds.join(', ')}`)
      }

      await runtime.customerRepository.markFollowUpsAnalyzed({
        customerId,
        followUpIds,
      })
    })
  }
}
