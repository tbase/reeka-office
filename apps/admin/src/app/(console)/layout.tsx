import type { ReactNode } from "react"

import { getAdminTenantName, getRequiredAdminContext } from "@/lib/admin-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"

export default async function ConsoleLayout({ children }: { children: ReactNode }) {
  const ctx = await getRequiredAdminContext()
  const tenantName = await getAdminTenantName(ctx.tenantId)

  return (
    <SidebarProvider>
      <AppSidebar tenantName={tenantName} />
      <SidebarInset>
        <header className="bg-background sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}
