import { describe, expect, it } from 'vitest'

import {
  ArchiveCustomerCommand,
  CreateCustomerCommand,
  CreateCustomerTypeConfigCommand,
  CreateFollowUpCommand,
  UpdateCustomerCommand,
  UpdateCustomerTypeConfigCommand,
  type CrmApplicationDependencies,
  type CrmRuntime,
  type CustomerGender,
  type CustomerDetail,
  type CustomerListInput,
  type CustomerListItem,
  type CustomerTypeConfig,
  type CustomerTypeSummary,
  type DuplicateCustomerCandidate,
  type FollowUpStatusConfig,
  type NormalizedCustomerInput,
  type NormalizedCustomerTypeConfig,
} from '../src'

class MemoryCrm {
  private nextCustomerTypeId = 1
  private nextFieldId = 1
  private nextStatusId = 1
  private nextCustomerId = 1
  private nextFollowUpId = 1

  readonly customerTypes = new Map<number, CustomerTypeConfig>()
  readonly customers = new Map<number, {
    id: number
    agentId: number
    customerTypeId: number
    name: string
    gender: CustomerGender | null
    phone: string | null
    wechat: string | null
    tags: string[]
    note: string | null
    archivedAt: Date | null
    lastFollowedAt: Date | null
    createdAt: Date
    updatedAt: Date
  }>()
  readonly profileValues: Array<{
    agentId: number
    customerId: number
    customerTypeId: number
    fieldId: number
    value: string
  }> = []
  readonly followUps: Array<{
    id: number
    agentId: number
    customerId: number
    customerTypeId: number
    statusId: number
    statusNameSnapshot: string
    followedAt: Date
    content: string
    createdAt: Date
  }> = []

  readonly runtime: CrmRuntime = {
    metadataRepository: {
      createCustomerType: config => this.createCustomerType(config),
      updateCustomerType: config => this.updateCustomerType(config),
    },
    customerRepository: {
      createCustomer: input => this.createCustomer(input),
      updateCustomer: (customerId, input) => this.updateCustomer(customerId, input),
      archiveCustomer: input => this.archiveCustomer(input),
      createFollowUp: input => this.createFollowUp(input),
    },
    readRepository: {
      listCustomerTypeSummaries: filters => this.listCustomerTypeSummaries(filters),
      getCustomerTypeConfig: id => Promise.resolve(this.customerTypes.get(id) ?? null),
      listCustomers: input => this.listCustomers(input),
      getCustomerDetail: input => Promise.resolve(this.getCustomerDetail(input.agentId, input.customerId)),
      findDuplicateCustomers: input => this.findDuplicateCustomers(input),
      getOwnedCustomer: input => Promise.resolve(this.getOwnedCustomer(input.agentId, input.customerId)),
    },
  }

  private async createCustomerType(config: NormalizedCustomerTypeConfig): Promise<number> {
    const id = this.nextCustomerTypeId++
    this.customerTypes.set(id, this.toConfig(id, config))
    return id
  }

  private async updateCustomerType(config: NormalizedCustomerTypeConfig & { id: number }): Promise<void> {
    this.customerTypes.set(config.id, this.toConfig(config.id, config))
  }

  private async createCustomer(input: NormalizedCustomerInput): Promise<number> {
    const id = this.nextCustomerId++
    const now = new Date('2026-04-01T00:00:00.000Z')
    this.customers.set(id, {
      id,
      agentId: input.agentId,
      customerTypeId: input.customerTypeId,
      name: input.name,
      gender: input.gender,
      phone: input.phone,
      wechat: input.wechat,
      tags: input.tags,
      note: input.note,
      archivedAt: null,
      lastFollowedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    this.replaceProfileValues(id, input)
    return id
  }

  private async updateCustomer(customerId: number, input: NormalizedCustomerInput): Promise<void> {
    const customer = this.customers.get(customerId)
    if (!customer || customer.agentId !== input.agentId) {
      return
    }
    this.customers.set(customerId, {
      ...customer,
      customerTypeId: input.customerTypeId,
      name: input.name,
      gender: input.gender,
      phone: input.phone,
      wechat: input.wechat,
      tags: input.tags,
      note: input.note,
    })
    this.replaceProfileValues(customerId, input)
  }

  private async archiveCustomer(input: { agentId: number; customerId: number; archivedAt: Date }): Promise<boolean> {
    const customer = this.customers.get(input.customerId)
    if (!customer || customer.agentId !== input.agentId || customer.archivedAt) {
      return false
    }
    customer.archivedAt = input.archivedAt
    return true
  }

  private async createFollowUp(input: {
    agentId: number
    customerId: number
    customerTypeId: number
    statusId: number
    statusNameSnapshot: string
    followedAt: Date
    content: string
  }): Promise<number> {
    const id = this.nextFollowUpId++
    this.followUps.push({
      id,
      ...input,
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
    })
    const customer = this.customers.get(input.customerId)
    if (customer && (!customer.lastFollowedAt || customer.lastFollowedAt < input.followedAt)) {
      customer.lastFollowedAt = input.followedAt
    }
    return id
  }

  private async listCustomerTypeSummaries(filters: { enabled?: boolean } = {}): Promise<CustomerTypeSummary[]> {
    return [...this.customerTypes.values()]
      .filter(type => filters.enabled == null || type.enabled === filters.enabled)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id)
      .map(type => ({
        id: type.id,
        name: type.name,
        description: type.description,
        enabled: type.enabled,
        supportsOpportunity: type.supportsOpportunity,
        sortOrder: type.sortOrder,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt,
      }))
  }

  private async listCustomers(input: CustomerListInput): Promise<CustomerListItem[]> {
    return [...this.customers.values()]
      .filter(customer => customer.agentId === input.agentId)
      .filter(customer => input.archived ? customer.archivedAt : !customer.archivedAt)
      .map(customer => ({
        ...customer,
        customerTypeName: this.customerTypes.get(customer.customerTypeId)?.name ?? '',
      }))
  }

  private async findDuplicateCustomers(input: {
    agentId: number
    customerTypeId: number
    phone?: string | null
    wechat?: string | null
    excludeCustomerId?: number | null
  }): Promise<DuplicateCustomerCandidate[]> {
    return [...this.customers.values()]
      .filter(customer => customer.agentId === input.agentId)
      .filter(customer => customer.customerTypeId === input.customerTypeId)
      .filter(customer => customer.id !== input.excludeCustomerId)
      .filter(customer =>
        Boolean(input.phone && customer.phone === input.phone)
        || Boolean(input.wechat && customer.wechat === input.wechat),
      )
      .map(customer => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        wechat: customer.wechat,
        archivedAt: customer.archivedAt,
      }))
  }

  private getOwnedCustomer(agentId: number, customerId: number) {
    const customer = this.customers.get(customerId)
    return customer?.agentId === agentId
      ? {
          id: customer.id,
          agentId: customer.agentId,
          customerTypeId: customer.customerTypeId,
          lastFollowedAt: customer.lastFollowedAt,
        }
      : null
  }

  private getCustomerDetail(agentId: number, customerId: number): CustomerDetail | null {
    const customer = this.customers.get(customerId)
    if (!customer || customer.agentId !== agentId) {
      return null
    }
    const type = this.customerTypes.get(customer.customerTypeId)
    const allProfileValues = this.profileValues
      .filter(value => value.customerId === customerId)
      .map(value => {
        const field = this.customerTypes.get(value.customerTypeId)?.profileFields.find(item => item.id === value.fieldId)
        return {
          fieldId: value.fieldId,
          customerTypeId: value.customerTypeId,
          fieldName: field?.name ?? null,
          fieldDescription: field?.description ?? null,
          fieldEnabled: field?.enabled ?? false,
          sortOrder: field?.sortOrder ?? 0,
          value: value.value,
        }
      })
    return {
      ...customer,
      customerTypeName: type?.name ?? '',
      currentProfileValues: allProfileValues.filter(value => value.customerTypeId === customer.customerTypeId && value.fieldEnabled),
      allProfileValues,
      followUps: this.followUps
        .filter(record => record.customerId === customerId)
        .map(record => ({
          id: record.id,
          customerTypeId: record.customerTypeId,
          statusId: record.statusId,
          statusNameSnapshot: record.statusNameSnapshot,
          followedAt: record.followedAt,
          content: record.content,
          createdAt: record.createdAt,
        })),
    }
  }

  private replaceProfileValues(customerId: number, input: NormalizedCustomerInput) {
    for (let index = this.profileValues.length - 1; index >= 0; index -= 1) {
      const value = this.profileValues[index]
      if (
        value.customerId === customerId
        && value.agentId === input.agentId
        && value.customerTypeId === input.customerTypeId
      ) {
        this.profileValues.splice(index, 1)
      }
    }
    this.profileValues.push(...input.profileValues.map(value => ({
      agentId: input.agentId,
      customerId,
      customerTypeId: input.customerTypeId,
      fieldId: value.fieldId,
      value: value.value,
    })))
  }

  private toConfig(id: number, config: NormalizedCustomerTypeConfig): CustomerTypeConfig {
    const now = new Date('2026-04-01T00:00:00.000Z')
    return {
      id,
      name: config.name,
      description: config.description,
      enabled: config.enabled,
      supportsOpportunity: config.supportsOpportunity,
      sortOrder: config.sortOrder,
      createdAt: now,
      updatedAt: now,
      profileFields: config.profileFields.map(field => ({
        id: field.id ?? this.nextFieldId++,
        customerTypeId: id,
        name: field.name,
        description: field.description,
        enabled: field.enabled,
        sortOrder: field.sortOrder,
      })),
      followUpStatuses: config.followUpStatuses.map(status => ({
        id: status.id ?? this.nextStatusId++,
        customerTypeId: id,
        name: status.name,
        enabled: status.enabled,
        sortOrder: status.sortOrder,
      } satisfies FollowUpStatusConfig)),
    }
  }
}

function deps(memory: MemoryCrm): CrmApplicationDependencies {
  return {
    executeInTransaction: async work => work(memory.runtime),
    now: () => new Date('2026-04-02T00:00:00.000Z'),
  }
}

async function seedCustomerTypes(memory: MemoryCrm) {
  const insuranceId = await new CreateCustomerTypeConfigCommand({
    name: '保险客户',
    profileFields: [{ name: '家庭情况' }],
    followUpStatuses: [{ name: '初聊' }],
  }, deps(memory)).execute()
  const recruitId = await new CreateCustomerTypeConfigCommand({
    name: '招募对象',
    profileFields: [{ name: '职业背景' }],
    followUpStatuses: [{ name: '邀约' }],
  }, deps(memory)).execute()

  return {
    insurance: memory.customerTypes.get(insuranceId)!,
    recruit: memory.customerTypes.get(recruitId)!,
  }
}

describe('CRM metadata commands', () => {
  it('creates and updates customer type config without deleting disabled rows', async () => {
    const memory = new MemoryCrm()
    const id = await new CreateCustomerTypeConfigCommand({
      name: '保险客户',
      profileFields: [{ name: '家庭情况' }],
      followUpStatuses: [{ name: '初聊' }],
    }, deps(memory)).execute()
    const config = memory.customerTypes.get(id)!

    await new UpdateCustomerTypeConfigCommand({
      id,
      name: '保险客户',
      enabled: true,
      supportsOpportunity: true,
      profileFields: [{ ...config.profileFields[0], enabled: false }],
      followUpStatuses: [{ ...config.followUpStatuses[0], enabled: false }],
    }, deps(memory)).execute()

    expect(memory.customerTypes.get(id)?.profileFields).toHaveLength(1)
    expect(memory.customerTypes.get(id)?.profileFields[0]?.enabled).toBe(false)
    expect(memory.customerTypes.get(id)?.followUpStatuses[0]?.enabled).toBe(false)
  })
})

describe('CRM customer commands', () => {
  it('keeps duplicate prompts scoped to same agent and customer type', async () => {
    const memory = new MemoryCrm()
    const { insurance, recruit } = await seedCustomerTypes(memory)

    await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
      phone: '13800000000',
      allowDuplicate: true,
    }, deps(memory)).execute()

    const sameScope = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice 2',
      phone: '13800000000',
    }, deps(memory)).execute()
    const differentType = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: recruit.id,
      name: 'Alice Recruit',
      phone: '13800000000',
    }, deps(memory)).execute()
    const differentAgent = await new CreateCustomerCommand({
      agentId: 2,
      customerTypeId: insurance.id,
      name: 'Alice Other',
      phone: '13800000000',
    }, deps(memory)).execute()

    expect(sameScope.customerId).toBeNull()
    expect(sameScope.duplicates).toHaveLength(1)
    expect(differentType.customerId).toBeTypeOf('number')
    expect(differentAgent.customerId).toBeTypeOf('number')
  })

  it('stores customer gender as M or F', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)

    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
      gender: 'F',
    }, deps(memory)).execute()

    await expect(memory.runtime.readRepository.getCustomerDetail({
      agentId: 1,
      customerId: created.customerId!,
    })).resolves.toMatchObject({
      name: 'Alice',
      gender: 'F',
    })
  })

  it('preserves old profile values when customer type changes and restores them when switching back', async () => {
    const memory = new MemoryCrm()
    const { insurance, recruit } = await seedCustomerTypes(memory)
    const insuranceField = insurance.profileFields[0]!
    const recruitField = recruit.profileFields[0]!
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
      profileValues: [{ fieldId: insuranceField.id, value: '三口之家' }],
    }, deps(memory)).execute()
    const customerId = created.customerId!

    await new UpdateCustomerCommand({
      agentId: 1,
      customerId,
      customerTypeId: recruit.id,
      name: 'Alice',
      profileValues: [{ fieldId: recruitField.id, value: '销售背景' }],
    }, deps(memory)).execute()
    await expect(memory.runtime.readRepository.getCustomerDetail({ agentId: 1, customerId }))
      .resolves
      .toMatchObject({
        currentProfileValues: [{ value: '销售背景' }],
      })

    await new UpdateCustomerCommand({
      agentId: 1,
      customerId,
      customerTypeId: insurance.id,
      name: 'Alice',
      profileValues: [{ fieldId: insuranceField.id, value: '三口之家' }],
    }, deps(memory)).execute()

    const detail = await memory.runtime.readRepository.getCustomerDetail({ agentId: 1, customerId })
    expect(detail?.currentProfileValues).toMatchObject([{ value: '三口之家' }])
    expect(detail?.allProfileValues.map(value => value.value).sort()).toEqual(['三口之家', '销售背景'])
  })

  it('archives only owned customers and keeps archived rows out of normal lists', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
    }, deps(memory)).execute()
    const customerId = created.customerId!

    await expect(new ArchiveCustomerCommand({ agentId: 2, customerId }, deps(memory)).execute()).resolves.toBe(false)
    await expect(new ArchiveCustomerCommand({ agentId: 1, customerId }, deps(memory)).execute()).resolves.toBe(true)
    await expect(memory.runtime.readRepository.listCustomers({ agentId: 1, archived: false })).resolves.toHaveLength(0)
    await expect(memory.runtime.readRepository.listCustomers({ agentId: 1, archived: true })).resolves.toHaveLength(1)
  })

  it('stores follow-up status snapshot and updates latest follow-up time', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
    }, deps(memory)).execute()
    const customerId = created.customerId!
    const status = insurance.followUpStatuses[0]!

    await new CreateFollowUpCommand({
      agentId: 1,
      customerId,
      statusId: status.id,
      followedAt: '2026-04-03 10:00',
      content: '完成初聊',
    }, deps(memory)).execute()

    const detail = await memory.runtime.readRepository.getCustomerDetail({ agentId: 1, customerId })
    expect(detail?.lastFollowedAt?.toISOString()).toBe('2026-04-03T02:00:00.000Z')
    expect(detail?.followUps[0]).toMatchObject({
      statusNameSnapshot: '初聊',
      content: '完成初聊',
    })
  })

  it('rejects disabled follow-up statuses', async () => {
    const memory = new MemoryCrm()
    const id = await new CreateCustomerTypeConfigCommand({
      name: '保险客户',
      followUpStatuses: [{ name: '初聊', enabled: false }],
    }, deps(memory)).execute()
    const type = memory.customerTypes.get(id)!
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: type.id,
      name: 'Alice',
      allowDuplicate: true,
    }, deps(memory)).execute()

    await expect(new CreateFollowUpCommand({
      agentId: 1,
      customerId: created.customerId!,
      statusId: type.followUpStatuses[0]!.id,
      content: '不会保存',
    }, deps(memory)).execute()).rejects.toThrow('跟进状态不可用')
  })
})
