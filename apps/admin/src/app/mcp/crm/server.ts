import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import {
  GetCustomerDetailByIdQuery,
  GetCustomerTypeConfigQuery,
  ListPendingAnalysisCustomersQuery,
  MarkFollowUpsAnalyzedCommand,
  PatchCustomerCommand,
  type CustomerDetail,
  type CustomerTypeConfig,
} from "@reeka-office/domain-crm"
import * as z from "zod/v4"

import {
  extractBearerToken,
  handleStreamableMcpRequest,
  jsonRpcError,
  jsonToolResult,
} from "@/lib/mcp"

const profileValueSchema = z.object({
  fieldId: z.number().int().positive().optional(),
  fieldName: z.string().min(1).optional(),
  value: z.string().optional().nullable(),
}).strict().refine(
  (value) => value.fieldId !== undefined || value.fieldName !== undefined,
  "画像值必须提供 fieldId 或 fieldName",
)

const patchCustomerSchema = z.object({
  customerId: z.number().int().positive(),
  customerTypeId: z.number().int().positive().optional(),
  name: z.string().optional(),
  gender: z.enum(["M", "F"]).optional().nullable(),
  birthday: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  wechat: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  note: z.string().optional().nullable(),
  profileValues: z.array(profileValueSchema).optional(),
}).strict()

const getCustomerSchema = z.object({
  customerId: z.number().int().positive(),
  pendingFollowUpsOnly: z.boolean().optional(),
}).strict()

const markFollowUpsAnalyzedSchema = z.object({
  customerId: z.number().int().positive(),
  followUpIds: z.array(z.number().int().positive()).min(1),
}).strict()

interface SanitizeCustomerDetailOptions {
  pendingFollowUpsOnly?: boolean
}

export async function handleCrmMcpRequest(request: Request): Promise<Response> {
  const authError = validateMcpRequest(request)
  if (authError) {
    return authError
  }

  return handleStreamableMcpRequest({
    request,
    server: createCrmMcpServer(),
    authInfo: {
      token: extractBearerToken(request)!,
      clientId: "crm-mcp",
      scopes: ["crm:read", "crm:write"],
    },
    errorLabel: "crm-mcp",
  })
}

function createCrmMcpServer() {
  const server = new McpServer({
    name: "reeka-office-crm",
    version: "1.0.0",
  })

  server.registerTool(
    "list_pending_customers",
    {
      title: "List pending CRM customers",
      description: "List unarchived CRM customers that have at least one pending follow-up analysis, including customer tags and the enabled customer type definitions referenced by the returned customers. Phone numbers are unavailable.",
      inputSchema: z.object({}).strict(),
    },
    async () => {
      const customers = await new ListPendingAnalysisCustomersQuery().query()
      const customerTypes = await getEnabledCustomerTypeConfigs(
        customers.map((customer) => customer.customerTypeId),
      )
      const enabledCustomerTypeIds = new Set(customerTypes.map((customerType) => customerType.id))

      return jsonToolResult({
        customers: customers
          .filter((customer) => enabledCustomerTypeIds.has(customer.customerTypeId))
          .map((customer) => ({
            customerId: customer.customerId,
            name: customer.name,
            customerTypeId: customer.customerTypeId,
          })),
        customerTypes: customerTypes.map(sanitizeCustomerTypeDefinition),
      })
    },
  )

  server.registerTool(
    "get_customer",
    {
      title: "Get CRM customer",
      description: "Read one CRM customer, profile values, and follow-up records by customerId. Set pendingFollowUpsOnly to true to return only follow-ups whose analysisStatus is pending. Phone numbers are sensitive and are never returned.",
      inputSchema: getCustomerSchema,
    },
    async ({ customerId, pendingFollowUpsOnly }) => {
      const customer = await new GetCustomerDetailByIdQuery({ customerId }).query()
      if (!customer) {
        throw new Error("客户不存在")
      }

      return jsonToolResult({
        customer: sanitizeCustomerDetail(customer, {
          pendingFollowUpsOnly,
        }),
      })
    },
  )

  server.registerTool(
    "patch_customer",
    {
      title: "Patch CRM customer",
      description: "Patch mutable CRM customer fields and profile values. profileValues can identify fields by fieldId or fieldName. Phone numbers are sensitive and cannot be read or modified; do not pass a phone field.",
      inputSchema: patchCustomerSchema,
    },
    async (input) => {
      const existing = await new GetCustomerDetailByIdQuery({ customerId: input.customerId }).query()
      if (!existing) {
        throw new Error("客户不存在")
      }

      const { profileValues, ...customerPatch } = input
      const targetCustomerTypeId = input.customerTypeId ?? existing.customerTypeId
      const resolvedProfileValues = profileValues === undefined
        ? undefined
        : await resolveProfileValues(targetCustomerTypeId, profileValues)

      await new PatchCustomerCommand({
        ...customerPatch,
        profileValues: resolvedProfileValues,
      }).execute()

      const customer = await new GetCustomerDetailByIdQuery({ customerId: input.customerId }).query()
      if (!customer) {
        throw new Error("客户不存在")
      }

      return jsonToolResult({
        customer: sanitizeCustomerDetail(customer),
      })
    },
  )

  server.registerTool(
    "mark_followups_analyzed",
    {
      title: "Mark CRM follow-ups analyzed",
      description: "Mark specific CRM follow-up records as analyzed after their content has been used to update the customer profile. Every followUpId must belong to the customer.",
      inputSchema: markFollowUpsAnalyzedSchema,
    },
    async (input) => {
      await new MarkFollowUpsAnalyzedCommand(input).execute()
      return jsonToolResult({
        customerId: input.customerId,
        followUpIds: [...new Set(input.followUpIds)],
        analysisStatus: "analyzed",
      })
    },
  )

  return server
}

function validateMcpRequest(request: Request): Response | null {
  const configuredToken = process.env.CRM_INTEGRATION_TOKEN?.trim()
  if (!configuredToken) {
    return jsonRpcError(-32603, "服务器配置错误", null, 500)
  }

  const token = extractBearerToken(request)
  if (!token || token !== configuredToken) {
    return jsonRpcError(-32001, "未授权", null, 401)
  }

  const origin = request.headers.get("origin")
  const allowedOrigins = parseAllowedOrigins(process.env.CRM_MCP_ALLOWED_ORIGINS)
  if (origin && allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
    return jsonRpcError(-32003, "Origin 不允许", null, 403)
  }

  return null
}

function parseAllowedOrigins(value?: string): string[] {
  return value
    ?.split(",")
    .map((item) => item.trim())
    .filter(Boolean) ?? []
}

async function getCustomerTypeConfig(customerTypeId: number) {
  const customerType = await new GetCustomerTypeConfigQuery({ customerTypeId }).query()
  if (!customerType?.enabled) {
    throw new Error("客户类型不可用")
  }

  return customerType
}

async function getEnabledCustomerTypeConfigs(customerTypeIds: number[]) {
  const uniqueCustomerTypeIds = [...new Set(customerTypeIds)]
  const customerTypes = await Promise.all(
    uniqueCustomerTypeIds.map((customerTypeId) => new GetCustomerTypeConfigQuery({ customerTypeId }).query()),
  )

  return customerTypes.filter((customerType): customerType is CustomerTypeConfig => Boolean(customerType?.enabled))
}

async function resolveProfileValues(
  customerTypeId: number,
  profileValues: z.infer<typeof profileValueSchema>[],
) {
  const customerType = await getCustomerTypeConfig(customerTypeId)
  const enabledFields = customerType.profileFields.filter((field) => field.enabled)
  const fieldsByName = new Map<string, CustomerTypeConfig["profileFields"][number][]>()

  for (const field of enabledFields) {
    const key = field.name.trim()
    fieldsByName.set(key, [...(fieldsByName.get(key) ?? []), field])
  }

  return profileValues.map((value) => {
    const fieldId = resolveProfileFieldId(value, fieldsByName)
    return {
      fieldId,
      value: value.value,
    }
  })
}

function resolveProfileFieldId(
  value: z.infer<typeof profileValueSchema>,
  fieldsByName: Map<string, CustomerTypeConfig["profileFields"][number][]>,
) {
  if (value.fieldName === undefined) {
    return value.fieldId!
  }

  const fields = fieldsByName.get(value.fieldName.trim()) ?? []
  if (fields.length === 0) {
    throw new Error(`画像字段不存在: ${value.fieldName}`)
  }
  if (fields.length > 1) {
    throw new Error(`画像字段名称重复，无法按名称写入: ${value.fieldName}`)
  }

  const field = fields[0]!
  if (value.fieldId !== undefined && value.fieldId !== field.id) {
    throw new Error(`画像字段 ID 与名称不匹配: ${value.fieldName}`)
  }

  return field.id
}

function sanitizeCustomerDetail(
  customer: CustomerDetail,
  options: SanitizeCustomerDetailOptions = {},
) {
  const followUps = options.pendingFollowUpsOnly
    ? customer.followUps.filter((followUp) => followUp.analysisStatus === "pending")
    : customer.followUps

  return {
    id: customer.id,
    agentId: customer.agentId,
    customerTypeId: customer.customerTypeId,
    name: customer.name,
    gender: customer.gender,
    birthday: customer.birthday,
    city: customer.city,
    wechat: customer.wechat,
    tags: customer.tags,
    note: customer.note,
    archivedAt: customer.archivedAt,
    lastFollowedAt: customer.lastFollowedAt,
    createdAt: customer.createdAt,
    updatedAt: customer.updatedAt,
    profiles: customer.currentProfileValues.map(sanitizeProfileValue),
    followUps: followUps.map((followUp) => ({
      id: followUp.id,
      method: followUp.method,
      followedAt: followUp.followedAt,
      content: followUp.content,
      analysisStatus: followUp.analysisStatus,
      createdAt: followUp.createdAt,
    })),
  }
}

function sanitizeCustomerTypeDefinition(customerType: CustomerTypeConfig) {
  return {
    id: customerType.id,
    name: customerType.name,
    description: customerType.description,
    profileFields: customerType.profileFields
      .filter((field) => field.enabled)
      .map(sanitizeProfileFieldDefinition),
    tags: customerType.tags
      .filter((tag) => tag.enabled)
      .map(sanitizeCustomerTagDefinition),
  }
}

function sanitizeCustomerTagDefinition(tag: CustomerTypeConfig["tags"][number]) {
  return {
    tagId: tag.id,
    tagName: tag.name,
  }
}

function sanitizeProfileFieldDefinition(field: CustomerTypeConfig["profileFields"][number]) {
  return {
    fieldId: field.id,
    fieldName: field.name,
    fieldDescription: field.description,
  }
}

function sanitizeProfileValue(value: CustomerDetail["allProfileValues"][number]) {
  return {
    fieldId: value.fieldId,
    customerTypeId: value.customerTypeId,
    value: value.value,
  }
}
