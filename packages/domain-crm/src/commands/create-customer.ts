import type { CrmApplicationDependencies } from '../application/runtime'
import { normalizeCustomerInput, type CustomerInput } from '../domain/customer'
import type { DuplicateCustomerCandidate } from '../domain/readModels'
import { executeWithCrmRuntime } from '../infra'

export interface CreateCustomerInput extends CustomerInput {
  allowDuplicate?: boolean
}

export interface CreateCustomerResult {
  customerId: number | null
  duplicates: DuplicateCustomerCandidate[]
}

const defaultDependencies: CrmApplicationDependencies = {
  executeInTransaction: executeWithCrmRuntime,
  now: () => new Date(),
}

export class CreateCustomerCommand {
  private readonly input: CreateCustomerInput
  private readonly dependencies: CrmApplicationDependencies

  constructor(input: CreateCustomerInput, dependencies: CrmApplicationDependencies = defaultDependencies) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<CreateCustomerResult> {
    const customer = normalizeCustomerInput(this.input)

    return this.dependencies.executeInTransaction(async (runtime) => {
      const customerType = await runtime.readRepository.getEnabledCustomerType(customer.customerTypeId)
      if (!customerType) {
        throw new Error('客户类型不可用')
      }

      assertProfileFieldsAllowed(
        customer.profileValues.map((item) => item.fieldId),
        customerType.profileFields.map((field) => field.id),
      )

      const duplicates = await runtime.readRepository.findDuplicateCustomers({
        agentId: customer.agentId,
        customerTypeId: customer.customerTypeId,
        phone: customer.phone,
        wechat: customer.wechat,
      })
      if (duplicates.length > 0 && !this.input.allowDuplicate) {
        return {
          customerId: null,
          duplicates,
        }
      }

      const customerId = await runtime.customerRepository.createCustomer(customer)
      return {
        customerId,
        duplicates: [],
      }
    })
  }
}

function assertProfileFieldsAllowed(fieldIds: number[], allowedFieldIds: number[]) {
  const allowed = new Set(allowedFieldIds)
  const invalid = fieldIds.filter((fieldId) => !allowed.has(fieldId))
  if (invalid.length > 0) {
    throw new Error(`画像字段不可用: ${invalid.join(', ')}`)
  }
}
