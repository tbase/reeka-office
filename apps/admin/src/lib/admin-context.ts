import { headers } from "next/headers"

import type { AdminSession } from "@/lib/auth"
import { auth } from "@/lib/auth"

export interface AdminContext {
  adminId: string
  tenantCode: string
}

export async function getRequiredAdminSession(): Promise<AdminSession> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error("管理员未登录")
  }

  return session
}

export async function getRequiredAdminContext(): Promise<AdminContext> {
  const session = await getRequiredAdminSession()
  const tenantCode = process.env.TENANT_CODE?.trim()

  if (!tenantCode) {
    throw new Error("租户配置缺失")
  }

  return {
    adminId: session.user.id,
    tenantCode,
  }
}
