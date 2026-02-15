import { CmsServicesClient } from "./services-client"
import { listCategories, listContents } from "./actions"

export const dynamic = "force-dynamic"

export default async function CmsServicesPage() {
  const [categories, items] = await Promise.all([
    listCategories(),
    listContents(),
  ])

  return <CmsServicesClient categories={categories} items={items} />
}
