import { eq } from "drizzle-orm"
import { headers } from "next/headers"

import { getDB } from "@/db"
import { tenants } from "@/db/schema"
import type { AdminSession } from "@/lib/auth"
import { auth } from "@/lib/auth"

export interface AdminContext {
  adminId: string
  tenantId: number
}

export async function getRequiredAdminSession(): Promise<AdminSession> {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    throw new Error("管理员未登录")
  }

  if (typeof session.user.tenantId !== "number") {
    throw new Error("管理员租户信息缺失")
  }

  return session
}

export async function getRequiredAdminContext(): Promise<AdminContext> {
  const session = await getRequiredAdminSession()

  return {
    adminId: session.user.id,
    tenantId: session.user.tenantId,
  }
}

export async function getAdminTenantName(tenantId: number): Promise<string> {
  const rows = await getDB()
    .select({
      name: tenants.name,
    })
    .from(tenants)
    .where(eq(tenants.id, tenantId))
    .limit(1)

  return rows[0]?.name ?? `租户 ${tenantId}`
}
