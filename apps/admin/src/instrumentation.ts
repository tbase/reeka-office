import { CmsDB } from "@reeka-office/domain-cms"
import { PointDB } from "@reeka-office/domain-point"

export async function register() {
  const [{ cmsSchema, setup: setupCms }, { pointSchema, setup: setupPoint }, { createDb }] = await Promise.all([
    import("@reeka-office/domain-cms"),
    import("@reeka-office/domain-point"),
    import("@/db"),
  ])

  const cmsDb = createDb(cmsSchema)
  setupCms({ db: cmsDb as unknown as CmsDB })

  const pointDb = createDb(pointSchema)
  setupPoint({ db: pointDb as unknown as PointDB })
}
