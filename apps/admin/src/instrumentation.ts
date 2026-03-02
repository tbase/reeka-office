import type { CmsDB } from "@reeka-office/domain-cms"
import type { PointDB } from "@reeka-office/domain-point"
import { UserDB } from "@reeka-office/domain-user"

export async function register() {
  const [{ userSchema, setup: setupUser }, { cmsSchema, setup: setupCms }, { pointSchema, setup: setupPoint }, { createDb }] = await Promise.all([
    import("@reeka-office/domain-user"),
    import("@reeka-office/domain-cms"),
    import("@reeka-office/domain-point"),
    import("@/db"),
  ])

  const userDB = createDb(userSchema)
  setupUser({ db: userDB as unknown as UserDB })

  const cmsDb = createDb(cmsSchema)
  setupCms({ db: cmsDb as unknown as CmsDB })

  const pointDb = createDb(pointSchema)
  setupPoint({ db: pointDb as unknown as PointDB })
}
