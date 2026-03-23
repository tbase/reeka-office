export interface TenantSummary {
  tenantCode: string
  tenantName: string
  adminDomain: string
  apiServiceName: string
  agentId: number
  boundAt?: string | null
}

const ACTIVE_TENANT_CODE_KEY = 'reeka-office.active-tenant-code'
const TENANT_LIST_KEY = 'reeka-office.tenant-list'

function isTenantSummary(value: unknown): value is TenantSummary {
  if (!value || typeof value !== 'object') {
    return false
  }

  const tenant = value as Partial<TenantSummary>
  return typeof tenant.tenantCode === 'string'
    && typeof tenant.tenantName === 'string'
    && typeof tenant.apiServiceName === 'string'
    && typeof tenant.agentId === 'number'
}

export function getCachedTenants(): TenantSummary[] {
  try {
    const value = wx.getStorageSync(TENANT_LIST_KEY)
    if (!Array.isArray(value)) {
      return []
    }

    return value.filter(isTenantSummary)
  } catch {
    return []
  }
}

export function setCachedTenants(tenants: TenantSummary[]): void {
  wx.setStorageSync(TENANT_LIST_KEY, tenants)
}

export function getActiveTenantCode(): string | null {
  try {
    const value = wx.getStorageSync(ACTIVE_TENANT_CODE_KEY)
    return typeof value === 'string' && value.trim() ? value : null
  } catch {
    return null
  }
}

export function setActiveTenantCode(tenantCode: string | null): void {
  if (!tenantCode) {
    wx.removeStorageSync(ACTIVE_TENANT_CODE_KEY)
    return
  }

  wx.setStorageSync(ACTIVE_TENANT_CODE_KEY, tenantCode)
}

export function getActiveTenant(): TenantSummary | null {
  let tenantCode = getActiveTenantCode()
  const tenants = getCachedTenants()
  if (!tenantCode && tenants.length > 0) {
    tenantCode = tenants[0].tenantCode
  }
  return tenants.find((tenant) => tenant.tenantCode === tenantCode) ?? null
}

export function syncCachedTenants(tenants: TenantSummary[]): TenantSummary | null {
  setCachedTenants(tenants)

  const activeTenantCode = getActiveTenantCode()
  if (!activeTenantCode) {
    return null
  }

  const activeTenant = tenants.find((tenant) => tenant.tenantCode === activeTenantCode) ?? null
  if (!activeTenant) {
    setActiveTenantCode(null)
  }

  return activeTenant
}

export function activateTenant(tenantCode: string): TenantSummary | null {
  const tenant = getCachedTenants().find((item) => item.tenantCode === tenantCode) ?? null
  if (!tenant) {
    return null
  }

  setActiveTenantCode(tenantCode)
  return tenant
}

export function clearTenantSession(): void {
  wx.removeStorageSync(ACTIVE_TENANT_CODE_KEY)
  wx.removeStorageSync(TENANT_LIST_KEY)
}
