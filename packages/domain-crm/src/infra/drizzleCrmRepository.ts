import { and, asc, desc, eq, isNotNull, isNull, like, lt, ne, or, sql } from 'drizzle-orm'

import type { DBExecutor } from '../context'
import type { NormalizedCustomerInput } from '../domain/customer'
import type { NormalizedCustomerTypeConfig, NormalizedFollowUpStatus, NormalizedProfileField } from '../domain/profile'
import type { CrmCustomerRepository, CrmMetadataRepository, CrmReadRepository } from '../domain/repositories'
import type {
  CustomerDetail,
  CustomerListInput,
  CustomerListItem,
  CustomerProfileValueDetail,
  CustomerTypeConfig,
  CustomerTypeSummaryFilters,
  CustomerTypeSummary,
  DuplicateCustomerCandidate,
  FollowUpRecordDetail,
  FollowUpStatusConfig,
  ProfileFieldConfig,
} from '../domain/readModels'
import {
  crmCustomerProfileValues,
  crmCustomers,
  crmCustomerTypes,
  crmFollowUpRecords,
  crmFollowUpStatuses,
  crmProfileFields,
  type NewCrmCustomerProfileValueRow,
} from '../schema'

export class DrizzleCrmRepository implements CrmMetadataRepository, CrmCustomerRepository, CrmReadRepository {
  private readonly db: DBExecutor

  constructor(db: DBExecutor) {
    this.db = db
  }

  async createCustomerType(config: NormalizedCustomerTypeConfig): Promise<number> {
    const result = await this.db.insert(crmCustomerTypes).values({
      name: config.name,
      description: config.description,
      enabled: config.enabled,
      supportsOpportunity: config.supportsOpportunity,
      sortOrder: config.sortOrder,
    }).$returningId()
    const customerTypeId = result[0]?.id
    if (!customerTypeId) {
      throw new Error('客户类型创建失败')
    }

    await this.saveProfileFields(customerTypeId, config.profileFields)
    await this.saveFollowUpStatuses(customerTypeId, config.followUpStatuses)
    return customerTypeId
  }

  async updateCustomerType(config: NormalizedCustomerTypeConfig & { id: number }): Promise<void> {
    await this.db
      .update(crmCustomerTypes)
      .set({
        name: config.name,
        description: config.description,
        enabled: config.enabled,
        supportsOpportunity: config.supportsOpportunity,
        sortOrder: config.sortOrder,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(eq(crmCustomerTypes.id, config.id))

    await this.saveProfileFields(config.id, config.profileFields)
    await this.saveFollowUpStatuses(config.id, config.followUpStatuses)
  }

  async createCustomer(input: NormalizedCustomerInput): Promise<number> {
    const result = await this.db.insert(crmCustomers).values({
      agentId: input.agentId,
      customerTypeId: input.customerTypeId,
      name: input.name,
      gender: input.gender,
      phone: input.phone,
      wechat: input.wechat,
      tags: input.tags,
      note: input.note,
    }).$returningId()
    const customerId = result[0]?.id
    if (!customerId) {
      throw new Error('客户创建失败')
    }

    await this.replaceProfileValues(customerId, input)
    return customerId
  }

  async updateCustomer(customerId: number, input: NormalizedCustomerInput): Promise<void> {
    await this.db
      .update(crmCustomers)
      .set({
        customerTypeId: input.customerTypeId,
        name: input.name,
        gender: input.gender,
        phone: input.phone,
        wechat: input.wechat,
        tags: input.tags,
        note: input.note,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(
        eq(crmCustomers.id, customerId),
        eq(crmCustomers.agentId, input.agentId),
      ))

    await this.replaceProfileValues(customerId, input)
  }

  async archiveCustomer(input: { agentId: number; customerId: number; archivedAt: Date }): Promise<boolean> {
    const result = await this.db
      .update(crmCustomers)
      .set({
        archivedAt: input.archivedAt,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(
        eq(crmCustomers.id, input.customerId),
        eq(crmCustomers.agentId, input.agentId),
        isNull(crmCustomers.archivedAt),
      ))

    return result[0]?.affectedRows > 0
  }

  async createFollowUp(input: {
    agentId: number
    customerId: number
    customerTypeId: number
    statusId: number
    statusNameSnapshot: string
    followedAt: Date
    content: string
  }): Promise<number> {
    const result = await this.db.insert(crmFollowUpRecords).values(input).$returningId()
    const followUpId = result[0]?.id
    if (!followUpId) {
      throw new Error('跟进记录创建失败')
    }

    await this.db
      .update(crmCustomers)
      .set({
        lastFollowedAt: input.followedAt,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(
        eq(crmCustomers.id, input.customerId),
        eq(crmCustomers.agentId, input.agentId),
        or(
          isNull(crmCustomers.lastFollowedAt),
          lt(crmCustomers.lastFollowedAt, input.followedAt),
        ),
      ))

    return followUpId
  }

  async updateFollowUp(input: {
    agentId: number
    customerId: number
    followUpId: number
    statusId: number
    statusNameSnapshot: string
    followedAt: Date
    content: string
  }): Promise<boolean> {
    const result = await this.db
      .update(crmFollowUpRecords)
      .set({
        statusId: input.statusId,
        statusNameSnapshot: input.statusNameSnapshot,
        followedAt: input.followedAt,
        content: input.content,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(
        eq(crmFollowUpRecords.id, input.followUpId),
        eq(crmFollowUpRecords.customerId, input.customerId),
        eq(crmFollowUpRecords.agentId, input.agentId),
      ))

    if (result[0]?.affectedRows <= 0) {
      return false
    }

    await this.db
      .update(crmCustomers)
      .set({
        lastFollowedAt: sql<Date | null>`(
          select max(${crmFollowUpRecords.followedAt})
          from ${crmFollowUpRecords}
          where ${crmFollowUpRecords.customerId} = ${input.customerId}
            and ${crmFollowUpRecords.agentId} = ${input.agentId}
        )`,
        updatedAt: sql`CURRENT_TIMESTAMP`,
      })
      .where(and(
        eq(crmCustomers.id, input.customerId),
        eq(crmCustomers.agentId, input.agentId),
      ))

    return true
  }

  async listCustomerTypeSummaries(filters: CustomerTypeSummaryFilters = {}): Promise<CustomerTypeSummary[]> {
    const conditions = []
    if (filters.enabled != null) {
      conditions.push(eq(crmCustomerTypes.enabled, filters.enabled))
    }

    return this.db
      .select({
        id: crmCustomerTypes.id,
        name: crmCustomerTypes.name,
        description: crmCustomerTypes.description,
        enabled: crmCustomerTypes.enabled,
        supportsOpportunity: crmCustomerTypes.supportsOpportunity,
        sortOrder: crmCustomerTypes.sortOrder,
        createdAt: crmCustomerTypes.createdAt,
        updatedAt: crmCustomerTypes.updatedAt,
      })
      .from(crmCustomerTypes)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(asc(crmCustomerTypes.sortOrder), asc(crmCustomerTypes.id))
  }

  async getCustomerTypeConfig(customerTypeId: number): Promise<CustomerTypeConfig | null> {
    const rows = await this.db
      .select()
      .from(crmCustomerTypes)
      .where(eq(crmCustomerTypes.id, customerTypeId))
      .limit(1)
    const row = rows[0]
    if (!row) {
      return null
    }

    const [profileFields, followUpStatuses] = await Promise.all([
      this.listProfileFields(customerTypeId),
      this.listFollowUpStatuses(customerTypeId),
    ])

    return {
      ...row,
      profileFields,
      followUpStatuses,
    }
  }

  async listCustomers(input: CustomerListInput): Promise<CustomerListItem[]> {
    const conditions = [
      eq(crmCustomers.agentId, input.agentId),
      input.archived ? isNotNull(crmCustomers.archivedAt) : isNull(crmCustomers.archivedAt),
    ]

    if (input.customerTypeId) {
      conditions.push(eq(crmCustomers.customerTypeId, input.customerTypeId))
    }

    const keyword = input.keyword?.trim()
    if (keyword) {
      const pattern = `%${keyword}%`
      conditions.push(
        or(
          like(crmCustomers.name, pattern),
          like(crmCustomers.phone, pattern),
          like(crmCustomers.wechat, pattern),
          sql`JSON_SEARCH(${crmCustomers.tags}, 'one', ${pattern}) IS NOT NULL`,
        )!,
      )
    }

    const rows = await this.db
      .select({
        id: crmCustomers.id,
        customerTypeId: crmCustomers.customerTypeId,
        customerTypeName: crmCustomerTypes.name,
        name: crmCustomers.name,
        gender: crmCustomers.gender,
        phone: crmCustomers.phone,
        wechat: crmCustomers.wechat,
        tags: crmCustomers.tags,
        lastFollowedAt: crmCustomers.lastFollowedAt,
        archivedAt: crmCustomers.archivedAt,
        createdAt: crmCustomers.createdAt,
        updatedAt: crmCustomers.updatedAt,
      })
      .from(crmCustomers)
      .innerJoin(crmCustomerTypes, eq(crmCustomers.customerTypeId, crmCustomerTypes.id))
      .where(and(...conditions))
      .orderBy(...buildCustomerOrder(input.sort))

    return rows.map((row) => ({
      ...row,
      tags: normalizeStoredTags(row.tags),
    }))
  }

  async getCustomerDetail(input: { agentId: number; customerId: number }): Promise<CustomerDetail | null> {
    const rows = await this.db
      .select({
        id: crmCustomers.id,
        agentId: crmCustomers.agentId,
        customerTypeId: crmCustomers.customerTypeId,
        customerTypeName: crmCustomerTypes.name,
        name: crmCustomers.name,
        gender: crmCustomers.gender,
        phone: crmCustomers.phone,
        wechat: crmCustomers.wechat,
        tags: crmCustomers.tags,
        note: crmCustomers.note,
        archivedAt: crmCustomers.archivedAt,
        lastFollowedAt: crmCustomers.lastFollowedAt,
        createdAt: crmCustomers.createdAt,
        updatedAt: crmCustomers.updatedAt,
      })
      .from(crmCustomers)
      .innerJoin(crmCustomerTypes, eq(crmCustomers.customerTypeId, crmCustomerTypes.id))
      .where(and(
        eq(crmCustomers.id, input.customerId),
        eq(crmCustomers.agentId, input.agentId),
      ))
      .limit(1)
    const customer = rows[0]
    if (!customer) {
      return null
    }

    const [profileValues, followUps] = await Promise.all([
      this.listProfileValues(input.customerId),
      this.listFollowUps(input.customerId),
    ])
    const currentProfileValues = profileValues
      .filter((value) =>
        value.customerTypeId === customer.customerTypeId
        && value.fieldEnabled,
      )
      .sort((left, right) => left.sortOrder - right.sortOrder)

    return {
      ...customer,
      tags: normalizeStoredTags(customer.tags),
      currentProfileValues,
      allProfileValues: profileValues,
      followUps,
    }
  }

  async findDuplicateCustomers(input: {
    agentId: number
    customerTypeId: number
    phone?: string | null
    wechat?: string | null
    excludeCustomerId?: number | null
  }): Promise<DuplicateCustomerCandidate[]> {
    const contactConditions = []
    if (input.phone) {
      contactConditions.push(eq(crmCustomers.phone, input.phone))
    }
    if (input.wechat) {
      contactConditions.push(eq(crmCustomers.wechat, input.wechat))
    }
    if (contactConditions.length === 0) {
      return []
    }

    const conditions = [
      eq(crmCustomers.agentId, input.agentId),
      eq(crmCustomers.customerTypeId, input.customerTypeId),
      or(...contactConditions)!,
    ]
    if (input.excludeCustomerId) {
      conditions.push(ne(crmCustomers.id, input.excludeCustomerId))
    }

    return this.db
      .select({
        id: crmCustomers.id,
        name: crmCustomers.name,
        phone: crmCustomers.phone,
        wechat: crmCustomers.wechat,
        archivedAt: crmCustomers.archivedAt,
      })
      .from(crmCustomers)
      .where(and(...conditions))
      .orderBy(desc(crmCustomers.updatedAt), desc(crmCustomers.id))
  }

  async getOwnedCustomer(input: { agentId: number; customerId: number }) {
    const rows = await this.db
      .select({
        id: crmCustomers.id,
        agentId: crmCustomers.agentId,
        customerTypeId: crmCustomers.customerTypeId,
        lastFollowedAt: crmCustomers.lastFollowedAt,
      })
      .from(crmCustomers)
      .where(and(
        eq(crmCustomers.id, input.customerId),
        eq(crmCustomers.agentId, input.agentId),
      ))
      .limit(1)

    return rows[0] ?? null
  }

  private async saveProfileFields(customerTypeId: number, fields: NormalizedProfileField[]): Promise<void> {
    for (const field of fields) {
      if (field.id) {
        await this.db
          .update(crmProfileFields)
          .set({
            name: field.name,
            description: field.description,
            enabled: field.enabled,
            sortOrder: field.sortOrder,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(and(
            eq(crmProfileFields.id, field.id),
            eq(crmProfileFields.customerTypeId, customerTypeId),
          ))
        continue
      }

      await this.db.insert(crmProfileFields).values({
        customerTypeId,
        name: field.name,
        description: field.description,
        enabled: field.enabled,
        sortOrder: field.sortOrder,
      })
    }
  }

  private async saveFollowUpStatuses(customerTypeId: number, statuses: NormalizedFollowUpStatus[]): Promise<void> {
    for (const status of statuses) {
      if (status.id) {
        await this.db
          .update(crmFollowUpStatuses)
          .set({
            name: status.name,
            enabled: status.enabled,
            sortOrder: status.sortOrder,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          })
          .where(and(
            eq(crmFollowUpStatuses.id, status.id),
            eq(crmFollowUpStatuses.customerTypeId, customerTypeId),
          ))
        continue
      }

      await this.db.insert(crmFollowUpStatuses).values({
        customerTypeId,
        name: status.name,
        enabled: status.enabled,
        sortOrder: status.sortOrder,
      })
    }
  }

  private async replaceProfileValues(customerId: number, input: NormalizedCustomerInput): Promise<void> {
    await this.db
      .delete(crmCustomerProfileValues)
      .where(and(
        eq(crmCustomerProfileValues.customerId, customerId),
        eq(crmCustomerProfileValues.agentId, input.agentId),
        eq(crmCustomerProfileValues.customerTypeId, input.customerTypeId),
      ))

    if (input.profileValues.length === 0) {
      return
    }

    const rows: NewCrmCustomerProfileValueRow[] = input.profileValues.map((item) => ({
      agentId: input.agentId,
      customerId,
      customerTypeId: input.customerTypeId,
      fieldId: item.fieldId,
      value: item.value,
    }))
    await this.db.insert(crmCustomerProfileValues).values(rows)
  }

  private async listProfileFields(customerTypeId: number): Promise<ProfileFieldConfig[]> {
    return this.db
      .select({
        id: crmProfileFields.id,
        customerTypeId: crmProfileFields.customerTypeId,
        name: crmProfileFields.name,
        description: crmProfileFields.description,
        enabled: crmProfileFields.enabled,
        sortOrder: crmProfileFields.sortOrder,
      })
      .from(crmProfileFields)
      .where(eq(crmProfileFields.customerTypeId, customerTypeId))
      .orderBy(asc(crmProfileFields.sortOrder), asc(crmProfileFields.id))
  }

  private async listFollowUpStatuses(customerTypeId: number): Promise<FollowUpStatusConfig[]> {
    return this.db
      .select({
        id: crmFollowUpStatuses.id,
        customerTypeId: crmFollowUpStatuses.customerTypeId,
        name: crmFollowUpStatuses.name,
        enabled: crmFollowUpStatuses.enabled,
        sortOrder: crmFollowUpStatuses.sortOrder,
      })
      .from(crmFollowUpStatuses)
      .where(eq(crmFollowUpStatuses.customerTypeId, customerTypeId))
      .orderBy(asc(crmFollowUpStatuses.sortOrder), asc(crmFollowUpStatuses.id))
  }

  private async listProfileValues(customerId: number): Promise<CustomerProfileValueDetail[]> {
    const rows = await this.db
      .select({
        fieldId: crmCustomerProfileValues.fieldId,
        customerTypeId: crmCustomerProfileValues.customerTypeId,
        fieldName: crmProfileFields.name,
        fieldDescription: crmProfileFields.description,
        fieldEnabled: crmProfileFields.enabled,
        sortOrder: crmProfileFields.sortOrder,
        value: crmCustomerProfileValues.value,
      })
      .from(crmCustomerProfileValues)
      .leftJoin(crmProfileFields, eq(crmCustomerProfileValues.fieldId, crmProfileFields.id))
      .where(eq(crmCustomerProfileValues.customerId, customerId))
      .orderBy(asc(crmCustomerProfileValues.customerTypeId), asc(crmProfileFields.sortOrder))

    return rows.map((row) => ({
      fieldId: row.fieldId,
      customerTypeId: row.customerTypeId,
      fieldName: row.fieldName,
      fieldDescription: row.fieldDescription,
      fieldEnabled: row.fieldEnabled ?? false,
      sortOrder: row.sortOrder ?? 0,
      value: row.value,
    }))
  }

  private async listFollowUps(customerId: number): Promise<FollowUpRecordDetail[]> {
    return this.db
      .select({
        id: crmFollowUpRecords.id,
        customerTypeId: crmFollowUpRecords.customerTypeId,
        statusId: crmFollowUpRecords.statusId,
        statusNameSnapshot: crmFollowUpRecords.statusNameSnapshot,
        followedAt: crmFollowUpRecords.followedAt,
        content: crmFollowUpRecords.content,
        createdAt: crmFollowUpRecords.createdAt,
      })
      .from(crmFollowUpRecords)
      .where(eq(crmFollowUpRecords.customerId, customerId))
      .orderBy(desc(crmFollowUpRecords.followedAt), desc(crmFollowUpRecords.id))
  }
}

function buildCustomerOrder(sort: CustomerListInput['sort'] = 'last_followed_desc') {
  if (sort === 'created_desc') {
    return [desc(crmCustomers.createdAt), desc(crmCustomers.id)]
  }

  return [
    desc(sql`COALESCE(${crmCustomers.lastFollowedAt}, ${crmCustomers.createdAt})`),
    desc(crmCustomers.id),
  ]
}

function normalizeStoredTags(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}
