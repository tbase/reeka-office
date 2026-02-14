import { CmsServicesClient } from "./services-client"
import { listCategories, listServiceItems } from "./actions"

export const dynamic = "force-dynamic"

export default async function CmsServicesPage() {
  const [categories, items] = await Promise.all([
    listCategories(),
    listServiceItems(),
  ])

  return <CmsServicesClient categories={categories} items={items} />
}
