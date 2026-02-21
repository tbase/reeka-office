export const dynamic = "force-dynamic"

import { Suspense } from "react"
import { PlusIcon } from "lucide-react"

import { LinkButton } from "@/components/ui/link-button"

import { ProductList } from "./product-list"
import { StatusTabs } from "./status-tabs"

const VALID_STATUSES = ["draft", "published", "off_shelf"] as const
type ProductStatus = (typeof VALID_STATUSES)[number]

function parseStatus(value: string | undefined): ProductStatus | undefined {
  if (VALID_STATUSES.includes(value as ProductStatus)) {
    return value as ProductStatus
  }
  return undefined
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = (await searchParams) ?? {}
  const status = parseStatus(typeof params.status === "string" ? params.status : undefined)

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">兑换商品</h1>
            <p className="text-muted-foreground text-sm">管理兑换商品的草稿、发布与下架生命周期。</p>
          </div>
          <LinkButton href="/points/products/new" size="sm">
            <PlusIcon className="size-4" />
            新增商品
          </LinkButton>
        </div>

        <StatusTabs />
      </div>

      <Suspense
        key={status ?? "all"}
        fallback={
          <div className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-sm">
            正在加载商品...
          </div>
        }
      >
        <ProductList status={status} />
      </Suspense>
    </div>
  )
}
