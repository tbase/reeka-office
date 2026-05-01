import { describe, expect, it } from 'vitest'

import {
  CreateCustomerCommand,
  CreateCustomerTypeConfigCommand,
  CreateFollowUpCommand,
  GetCustomerDetailByIdQuery,
  ListPendingAnalysisCustomersQuery,
  MarkFollowUpsAnalyzedCommand,
  PatchCustomerCommand,
  UpdateCustomerCommand,
  UpdateFollowUpCommand,
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
  type FollowUpMethod,
  type NormalizedCustomerInput,
  type NormalizedCustomerTypeConfig,
} from '../src'

interface MemoryCustomer {
  id: number
  agentId: number
  customerTypeId: number
  name: string
  nameInitial: string
  gender: CustomerGender | null
  birthday: string | null
  city: string | null
  phone: string | null
  wechat: string | null
  tags: string[]
  note: string | null
  archivedAt: Date | null
  lastFollowedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

class MemoryCrm {
  private nextCustomerTypeId = 1
  private nextFieldId = 1
  private nextCustomerId = 1
  private nextFollowUpId = 1

  readonly customerTypes = new Map<number, CustomerTypeConfig>()
  readonly customers = new Map<number, MemoryCustomer>()
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
    method: FollowUpMethod | null
    followedAt: Date
    content: string
    analysisStatus: 'pending' | 'analyzed'
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
      createFollowUp: input => this.createFollowUp(input),
      updateFollowUp: input => this.updateFollowUp(input),
      markFollowUpsAnalyzed: input => this.markFollowUpsAnalyzed(input),
    },
    readRepository: {
      listCustomerTypeSummaries: filters => this.listCustomerTypeSummaries(filters),
      getCustomerTypeConfig: id => Promise.resolve(this.customerTypes.get(id) ?? null),
      listCustomers: input => this.listCustomers(input),
      getCustomerDetail: input => Promise.resolve(this.getCustomerDetail(input.agentId, input.customerId)),
      getCustomerDetailById: customerId => Promise.resolve(this.getCustomerDetailById(customerId)),
      listPendingAnalysisCustomers: () => this.listPendingAnalysisCustomers(),
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
    const existing = this.customerTypes.get(config.id)
    if (existing) {
      const keptFieldIds = config.profileFields.flatMap(field => field.id ? [field.id] : [])
      const deletedFieldIds = existing.profileFields
        .map(field => field.id)
        .filter(fieldId => !keptFieldIds.includes(fieldId))

      if (deletedFieldIds.length > 0) {
        for (let index = this.profileValues.length - 1; index >= 0; index -= 1) {
          const value = this.profileValues[index]
          if (value.customerTypeId === config.id && deletedFieldIds.includes(value.fieldId)) {
            this.profileValues.splice(index, 1)
          }
        }
      }
    }

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
      nameInitial: input.nameInitial,
      gender: input.gender,
      birthday: input.birthday,
      city: input.city,
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
      nameInitial: input.nameInitial,
      gender: input.gender,
      birthday: input.birthday,
      city: input.city,
      phone: input.phone,
      wechat: input.wechat,
      tags: input.tags,
      note: input.note,
    })
    this.replaceProfileValues(customerId, input)
  }

  private async createFollowUp(input: {
    agentId: number
    customerId: number
    customerTypeId: number
    method: FollowUpMethod | null
    followedAt: Date
    content: string
  }): Promise<number> {
    const id = this.nextFollowUpId++
    this.followUps.push({
      id,
      ...input,
      analysisStatus: 'pending',
      createdAt: new Date('2026-04-01T00:00:00.000Z'),
    })
    const customer = this.customers.get(input.customerId)
    if (customer && (!customer.lastFollowedAt || customer.lastFollowedAt < input.followedAt)) {
      customer.lastFollowedAt = input.followedAt
    }
    return id
  }

  private async updateFollowUp(input: {
    agentId: number
    customerId: number
    followUpId: number
    method?: FollowUpMethod | null
    followedAt: Date
    content: string
  }): Promise<boolean> {
    const followUp = this.followUps.find(record =>
      record.id === input.followUpId
      && record.customerId === input.customerId
      && record.agentId === input.agentId,
    )
    if (!followUp) {
      return false
    }

    if (input.method !== undefined) {
      followUp.method = input.method
    }
    followUp.followedAt = input.followedAt
    followUp.content = input.content
    followUp.analysisStatus = 'pending'

    const customer = this.customers.get(input.customerId)
    if (customer) {
      const latest = this.followUps
        .filter(record => record.customerId === input.customerId && record.agentId === input.agentId)
        .reduce<Date | null>((max, record) => !max || max < record.followedAt ? record.followedAt : max, null)
      customer.lastFollowedAt = latest
    }

    return true
  }

  private async markFollowUpsAnalyzed(input: {
    customerId: number
    followUpIds: number[]
  }): Promise<void> {
    const followUpIds = new Set(input.followUpIds)
    for (const followUp of this.followUps) {
      if (followUp.customerId === input.customerId && followUpIds.has(followUp.id)) {
        followUp.analysisStatus = 'analyzed'
      }
    }
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
      .filter(customer => input.archived === undefined || (input.archived ? customer.archivedAt : !customer.archivedAt))
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
    return this.toCustomerDetail(customer)
  }

  private getCustomerDetailById(customerId: number): CustomerDetail | null {
    const customer = this.customers.get(customerId)
    if (!customer) {
      return null
    }
    return this.toCustomerDetail(customer)
  }

  private async listPendingAnalysisCustomers() {
    const latestPendingByCustomer = new Map<number, Date>()
    for (const record of this.followUps) {
      const customer = this.customers.get(record.customerId)
      if (!customer || customer.archivedAt || record.analysisStatus !== 'pending') {
        continue
      }

      const latest = latestPendingByCustomer.get(record.customerId)
      if (!latest || latest < record.followedAt) {
        latestPendingByCustomer.set(record.customerId, record.followedAt)
      }
    }

    return [...latestPendingByCustomer.entries()]
      .sort(([leftCustomerId, leftTime], [rightCustomerId, rightTime]) =>
        rightTime.getTime() - leftTime.getTime() || rightCustomerId - leftCustomerId,
      )
      .map(([customerId]) => {
        const customer = this.customers.get(customerId)!
        return {
          customerId,
          customerTypeId: customer.customerTypeId,
          name: customer.name,
        }
      })
  }

  private toCustomerDetail(customer: MemoryCustomer): CustomerDetail {
    const type = this.customerTypes.get(customer.customerTypeId)
    const allProfileValues = this.profileValues
      .filter(value => value.customerId === customer.id)
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
        .filter(record => record.customerId === customer.id)
        .map(record => ({
          id: record.id,
          customerTypeId: record.customerTypeId,
          method: record.method,
          followedAt: record.followedAt,
          content: record.content,
          analysisStatus: record.analysisStatus,
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
  }, deps(memory)).execute()
  const recruitId = await new CreateCustomerTypeConfigCommand({
    name: '招募对象',
    profileFields: [{ name: '职业背景' }],
  }, deps(memory)).execute()

  return {
    insurance: memory.customerTypes.get(insuranceId)!,
    recruit: memory.customerTypes.get(recruitId)!,
  }
}

describe('CRM metadata commands', () => {
  it('rejects duplicate profile field names', async () => {
    const memory = new MemoryCrm()

    await expect(new CreateCustomerTypeConfigCommand({
      name: '保险客户',
      profileFields: [
        { name: '家庭情况' },
        { name: ' 家庭情况 ' },
      ],
    }, deps(memory)).execute()).rejects.toThrow('画像字段名称不能重复')
  })

  it('creates and updates customer type config without deleting disabled rows', async () => {
    const memory = new MemoryCrm()
    const id = await new CreateCustomerTypeConfigCommand({
      name: '保险客户',
      profileFields: [{ name: '家庭情况' }],
    }, deps(memory)).execute()
    const config = memory.customerTypes.get(id)!

    await new UpdateCustomerTypeConfigCommand({
      id,
      name: '保险客户',
      enabled: true,
      supportsOpportunity: true,
      profileFields: [{ ...config.profileFields[0], enabled: false }],
    }, deps(memory)).execute()

    expect(memory.customerTypes.get(id)?.profileFields).toHaveLength(1)
    expect(memory.customerTypes.get(id)?.profileFields[0]?.enabled).toBe(false)
  })

  it('deletes omitted profile fields and their profile values when updating config', async () => {
    const memory = new MemoryCrm()
    const id = await new CreateCustomerTypeConfigCommand({
      name: '保险客户',
      profileFields: [
        { name: '家庭情况' },
        { name: '客户来源' },
      ],
    }, deps(memory)).execute()
    const config = memory.customerTypes.get(id)!
    const keptField = config.profileFields[0]!
    const deletedField = config.profileFields[1]!

    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: id,
      name: 'Alice',
      profileValues: [
        { fieldId: keptField.id, value: '三口之家' },
        { fieldId: deletedField.id, value: '朋友介绍' },
      ],
    }, deps(memory)).execute()

    await new UpdateCustomerTypeConfigCommand({
      id,
      name: '保险客户',
      profileFields: [keptField],
    }, deps(memory)).execute()

    expect(memory.customerTypes.get(id)?.profileFields.map(field => field.name)).toEqual(['家庭情况'])
    expect(memory.profileValues.map(value => value.fieldId)).toEqual([keptField.id])
    await expect(new GetCustomerDetailByIdQuery({
      customerId: created.customerId!,
    }, memory.runtime.readRepository).query())
      .resolves
      .toMatchObject({
        allProfileValues: [
          {
            fieldId: keptField.id,
            value: '三口之家',
          },
        ],
      })
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

  it('stores customer name initial for list indexing', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)

    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: '张三',
      nameInitial: 'Z',
    }, deps(memory)).execute()
    const customerId = created.customerId!

    await expect(memory.runtime.readRepository.getCustomerDetail({
      agentId: 1,
      customerId,
    })).resolves.toMatchObject({
      name: '张三',
      nameInitial: 'Z',
    })

    await new UpdateCustomerCommand({
      agentId: 1,
      customerId,
      customerTypeId: insurance.id,
      name: '李四',
      nameInitial: 'L',
    }, deps(memory)).execute()

    await expect(memory.runtime.readRepository.listCustomers({ agentId: 1 }))
      .resolves
      .toMatchObject([{ name: '李四', nameInitial: 'L' }])
  })

  it('stores birthday and city as basic customer fields', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)

    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
      birthday: '1990-05-20',
      city: '上海',
    }, deps(memory)).execute()

    await expect(memory.runtime.readRepository.getCustomerDetail({
      agentId: 1,
      customerId: created.customerId!,
    })).resolves.toMatchObject({
      birthday: '1990-05-20',
      city: '上海',
    })
  })

  it('rejects invalid birthday values', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)

    await expect(new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
      birthday: '1990-02-31',
    }, deps(memory)).execute()).rejects.toThrow('生日无效')
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

  it('keeps archived rows queryable without hiding them by default', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
    }, deps(memory)).execute()
    const customerId = created.customerId!
    memory.customers.get(customerId)!.archivedAt = new Date('2026-04-05T00:00:00.000Z')

    await expect(memory.runtime.readRepository.listCustomers({ agentId: 1 })).resolves.toHaveLength(1)
    await expect(memory.runtime.readRepository.listCustomers({ agentId: 1, archived: false })).resolves.toHaveLength(0)
    await expect(memory.runtime.readRepository.listCustomers({ agentId: 1, archived: true })).resolves.toHaveLength(1)
  })

  it('lists customers with pending follow-up analysis only', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const alice = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
    }, deps(memory)).execute()
    const bob = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Bob',
    }, deps(memory)).execute()
    const analyzed = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Analyzed',
    }, deps(memory)).execute()
    const archived = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Archived',
    }, deps(memory)).execute()

    await new CreateFollowUpCommand({
      agentId: 1,
      customerId: alice.customerId!,
      followedAt: '2026-04-03 10:00',
      content: 'Alice pending',
    }, deps(memory)).execute()
    await new CreateFollowUpCommand({
      agentId: 1,
      customerId: bob.customerId!,
      followedAt: '2026-04-04 10:00',
      content: 'Bob pending',
    }, deps(memory)).execute()
    await new CreateFollowUpCommand({
      agentId: 1,
      customerId: analyzed.customerId!,
      followedAt: '2026-04-05 10:00',
      content: 'Analyzed',
    }, deps(memory)).execute()
    await new CreateFollowUpCommand({
      agentId: 1,
      customerId: archived.customerId!,
      followedAt: '2026-04-06 10:00',
      content: 'Archived',
    }, deps(memory)).execute()

    memory.followUps.find(record => record.customerId === analyzed.customerId)!.analysisStatus = 'analyzed'
    memory.customers.get(archived.customerId!)!.archivedAt = new Date('2026-04-06T00:00:00.000Z')

    await expect(new ListPendingAnalysisCustomersQuery(memory.runtime.readRepository).query())
      .resolves
      .toEqual([
        { customerId: bob.customerId!, customerTypeId: insurance.id, name: 'Bob' },
        { customerId: alice.customerId!, customerTypeId: insurance.id, name: 'Alice' },
      ])
  })

  it('gets customer detail by customer id without agent scope', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const created = await new CreateCustomerCommand({
      agentId: 2,
      customerTypeId: insurance.id,
      name: 'Alice',
    }, deps(memory)).execute()

    await expect(new GetCustomerDetailByIdQuery({
      customerId: created.customerId!,
    }, memory.runtime.readRepository).query())
      .resolves
      .toMatchObject({
        id: created.customerId,
        agentId: 2,
        name: 'Alice',
      })
  })

  it('marks customer follow-up records as analyzed', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
    }, deps(memory)).execute()
    const customerId = created.customerId!
    const firstFollowUpId = await new CreateFollowUpCommand({
      agentId: 1,
      customerId,
      followedAt: '2026-04-03 10:00',
      content: '第一次跟进',
    }, deps(memory)).execute()
    const secondFollowUpId = await new CreateFollowUpCommand({
      agentId: 1,
      customerId,
      followedAt: '2026-04-04 10:00',
      content: '第二次跟进',
    }, deps(memory)).execute()

    await new MarkFollowUpsAnalyzedCommand({
      customerId,
      followUpIds: [firstFollowUpId, firstFollowUpId],
    }, deps(memory)).execute()

    const detail = await memory.runtime.readRepository.getCustomerDetail({ agentId: 1, customerId })
    expect(detail?.followUps.find(record => record.id === firstFollowUpId)?.analysisStatus).toBe('analyzed')
    expect(detail?.followUps.find(record => record.id === secondFollowUpId)?.analysisStatus).toBe('pending')
  })

  it('rejects analyzed markers for follow-up records outside the customer', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const alice = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
    }, deps(memory)).execute()
    const bob = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Bob',
    }, deps(memory)).execute()
    const bobFollowUpId = await new CreateFollowUpCommand({
      agentId: 1,
      customerId: bob.customerId!,
      followedAt: '2026-04-04 10:00',
      content: 'Bob 跟进',
    }, deps(memory)).execute()

    await expect(new MarkFollowUpsAnalyzedCommand({
      customerId: alice.customerId!,
      followUpIds: [bobFollowUpId],
    }, deps(memory)).execute()).rejects.toThrow('跟进记录不存在或不属于该客户')
  })

  it('patches customer fields while preserving phone and omitted profile values', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const field = insurance.profileFields[0]!
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
      city: '上海',
      phone: '13800000000',
      note: '原备注',
      profileValues: [{ fieldId: field.id, value: '三口之家' }],
    }, deps(memory)).execute()
    const customerId = created.customerId!

    await new PatchCustomerCommand({
      customerId,
      note: 'AI 分析结果',
      tags: ['重点'],
    }, deps(memory)).execute()

    let detail = await memory.runtime.readRepository.getCustomerDetail({ agentId: 1, customerId })
    expect(detail).toMatchObject({
      name: 'Alice',
      city: '上海',
      phone: '13800000000',
      note: 'AI 分析结果',
      tags: ['重点'],
      currentProfileValues: [{ value: '三口之家' }],
    })

    await new PatchCustomerCommand({
      customerId,
      profileValues: [],
    }, deps(memory)).execute()

    detail = await memory.runtime.readRepository.getCustomerDetail({ agentId: 1, customerId })
    expect(detail?.phone).toBe('13800000000')
    expect(detail?.currentProfileValues).toEqual([])
  })

  it('stores follow-up method and updates latest follow-up time', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
    }, deps(memory)).execute()
    const customerId = created.customerId!

    await new CreateFollowUpCommand({
      agentId: 1,
      customerId,
      method: 'face',
      followedAt: '2026-04-03 10:00',
      content: '完成初聊',
    }, deps(memory)).execute()

    const detail = await memory.runtime.readRepository.getCustomerDetail({ agentId: 1, customerId })
    expect(detail?.lastFollowedAt?.toISOString()).toBe('2026-04-03T02:00:00.000Z')
    expect(detail?.followUps[0]).toMatchObject({
      method: 'face',
      content: '完成初聊',
      analysisStatus: 'pending',
    })
  })

  it('allows follow-up records without method', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
    }, deps(memory)).execute()
    const customerId = created.customerId!

    await new CreateFollowUpCommand({
      agentId: 1,
      customerId,
      followedAt: '2026-04-03 10:00',
      content: '直接记录跟进内容',
    }, deps(memory)).execute()

    const detail = await memory.runtime.readRepository.getCustomerDetail({ agentId: 1, customerId })
    expect(detail?.followUps[0]).toMatchObject({
      method: null,
      analysisStatus: 'pending',
      content: '直接记录跟进内容',
    })
  })

  it('preserves follow-up method when update omits method', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
    }, deps(memory)).execute()
    const customerId = created.customerId!
    const followUpId = await new CreateFollowUpCommand({
      agentId: 1,
      customerId,
      method: 'phone',
      followedAt: '2026-04-03 10:00',
      content: '完成初聊',
    }, deps(memory)).execute()
    memory.followUps[0]!.analysisStatus = 'analyzed'

    await new UpdateFollowUpCommand({
      agentId: 1,
      customerId,
      followUpId,
      followedAt: '2026-04-04 11:00',
      content: '补充记录',
    }, deps(memory)).execute()

    const detail = await memory.runtime.readRepository.getCustomerDetail({ agentId: 1, customerId })
    expect(detail?.followUps[0]).toMatchObject({
      method: 'phone',
      analysisStatus: 'pending',
      content: '补充记录',
    })
  })

  it('rejects invalid follow-up methods', async () => {
    const memory = new MemoryCrm()
    const { insurance } = await seedCustomerTypes(memory)
    const created = await new CreateCustomerCommand({
      agentId: 1,
      customerTypeId: insurance.id,
      name: 'Alice',
      allowDuplicate: true,
    }, deps(memory)).execute()

    await expect(new CreateFollowUpCommand({
      agentId: 1,
      customerId: created.customerId!,
      method: 'invalid' as never,
      content: '不会保存',
    }, deps(memory)).execute()).rejects.toThrow('跟进方式无效')
  })
})
