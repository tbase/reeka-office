import type { CrmApplicationDependencies } from '../application/runtime'
import {
  normalizeCustomerInput,
  normalizePositiveId,
  type CustomerGender,
  type ProfileValueInput,
} from '../domain/customer'
import { executeWithCrmRuntime } from '../infra'

export interface PatchCustomerInput {
  customerId: number
  customerTypeId?: number
  name?: string
  nameInitial?: string | null
  gender?: CustomerGender | null
  birthday?: string | null
  city?: string | null
  wechat?: string | null
  tags?: string[]
  note?: string | null
  profileValues?: ProfileValueInput[]
}

const defaultDependencies: CrmApplicationDependencies = {
  executeInTransaction: executeWithCrmRuntime,
  now: () => new Date(),
}

export class PatchCustomerCommand {
  private readonly input: PatchCustomerInput
  private readonly dependencies: CrmApplicationDependencies

  constructor(input: PatchCustomerInput, dependencies: CrmApplicationDependencies = defaultDependencies) {
    this.input = input
    this.dependencies = dependencies
  }

  async execute(): Promise<void> {
    const customerId = normalizePositiveId(this.input.customerId, '客户 ID 无效')

    await this.dependencies.executeInTransaction(async (runtime) => {
      const existing = await runtime.readRepository.getCustomerDetailById(customerId)
      if (!existing) {
        throw new Error('客户不存在')
      }

      const customerTypeId = this.input.customerTypeId ?? existing.customerTypeId
      const profileValues = this.input.profileValues ?? existing.allProfileValues
        .filter((value) => value.customerTypeId === customerTypeId)
        .map((value) => ({
          fieldId: value.fieldId,
          value: value.value,
        }))

      const customer = normalizeCustomerInput({
        agentId: existing.agentId,
        customerTypeId,
        name: this.input.name ?? existing.name,
        nameInitial: this.input.nameInitial === undefined ? existing.nameInitial : this.input.nameInitial,
        gender: this.input.gender === undefined ? existing.gender : this.input.gender,
        birthday: this.input.birthday === undefined ? existing.birthday : this.input.birthday,
        city: this.input.city === undefined ? existing.city : this.input.city,
        phone: existing.phone,
        wechat: this.input.wechat === undefined ? existing.wechat : this.input.wechat,
        tags: this.input.tags ?? existing.tags,
        note: this.input.note === undefined ? existing.note : this.input.note,
        profileValues,
      })

      const customerType = await runtime.readRepository.getCustomerTypeConfig(customer.customerTypeId)
      if (!customerType?.enabled) {
        throw new Error('客户类型不可用')
      }

      if (this.input.profileValues !== undefined) {
        assertProfileFieldsAllowed(
          customer.profileValues.map((item) => item.fieldId),
          customerType.profileFields.filter((field) => field.enabled).map((field) => field.id),
        )
      }

      await runtime.customerRepository.updateCustomer(customerId, customer)
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
