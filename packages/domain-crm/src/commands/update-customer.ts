import type { CrmApplicationDependencies } from '../application/runtime'
import { assertCustomerTagsAllowed, normalizeCustomerInput, normalizePositiveId, type CustomerInput } from '../domain/customer'
import type { DuplicateCustomerCandidate } from '../domain/readModels'
import { executeWithCrmRuntime } from '../infra'

export interface UpdateCustomerInput extends CustomerInput {
  customerId: number
  allowDuplicate?: boolean
}

export interface UpdateCustomerResult {
  customerId: number | null
  duplicates: DuplicateCustomerCandidate[]
}

const defaultDependencies: CrmApplicationDependencies = {
  executeInTransaction: executeWithCrmRuntime,
  now: () => new Date(),
}

export class UpdateCustomerCommand {
  private readonly input: UpdateCustomerInput
  private readonly dependencies: CrmApplicationDependencies

  constructor(input: UpdateCustomerInput, dependencies: CrmApplicationDependencies = defaultDependencies) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<UpdateCustomerResult> {
    const customerId = normalizePositiveId(this.input.customerId, '客户 ID 无效')
    const customer = normalizeCustomerInput(this.input)

    return this.dependencies.executeInTransaction(async (runtime) => {
      const existing = await runtime.readRepository.getOwnedCustomer({
        agentId: customer.agentId,
        customerId,
      })
      if (!existing) {
        throw new Error('客户不存在')
      }

      const customerType = await runtime.readRepository.getCustomerTypeConfig(customer.customerTypeId)
      if (!customerType?.enabled) {
        throw new Error('客户类型不可用')
      }

      const allowedFieldIds = new Set(
        customerType.profileFields.filter((field) => field.enabled).map((field) => field.id),
      )
      const invalidFieldIds = customer.profileValues
        .map((item) => item.fieldId)
        .filter((fieldId) => !allowedFieldIds.has(fieldId))
      if (invalidFieldIds.length > 0) {
        throw new Error(`画像字段不可用: ${invalidFieldIds.join(', ')}`)
      }
      assertCustomerTagsAllowed(
        customer.tags,
        customerType.tags.filter((tag) => tag.enabled).map((tag) => tag.name),
        existing.tags,
      )

      const duplicates = await runtime.readRepository.findDuplicateCustomers({
        agentId: customer.agentId,
        customerTypeId: customer.customerTypeId,
        phone: customer.phone,
        wechat: customer.wechat,
        excludeCustomerId: customerId,
      })
      if (duplicates.length > 0 && !this.input.allowDuplicate) {
        return {
          customerId: null,
          duplicates,
        }
      }

      await runtime.customerRepository.updateCustomer(customerId, customer)
      return {
        customerId,
        duplicates: [],
      }
    })
  }
}
