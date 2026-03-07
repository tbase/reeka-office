import type { CmsDB } from "@reeka-office/domain-cms"
import type { NewbieDB } from "@reeka-office/domain-newbie"
import type { PointDB } from "@reeka-office/domain-point"
import { UserDB } from "@reeka-office/domain-user"

export async function register() {
  const [{ userSchema, setup: setupUser }, { cmsSchema, setup: setupCms }, { newbieSchema, setup: setupNewbie }, { pointSchema, setup: setupPoint }, { createDb }] = await Promise.all([
    import("@reeka-office/domain-user"),
    import("@reeka-office/domain-cms"),
    import("@reeka-office/domain-newbie"),
    import("@reeka-office/domain-point"),
    import("@/db"),
  ])

  const userDB = createDb(userSchema)
  setupUser({ db: userDB as unknown as UserDB })

  const cmsDb = createDb(cmsSchema)
  setupCms({ db: cmsDb as unknown as CmsDB })

  const newbieDb = createDb(newbieSchema)
  setupNewbie({ db: newbieDb as unknown as NewbieDB })

  const pointDb = createDb(pointSchema)
  setupPoint({ db: pointDb as unknown as PointDB })
}
