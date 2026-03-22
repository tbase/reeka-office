import type { CmsDB } from "@reeka-office/domain-cms"
import type { AgentDB } from "@reeka-office/domain-agent"
import type { IdentityDB } from "@reeka-office/domain-identity"
import type { PlanDB } from "@reeka-office/domain-plan"
import type { PointDB } from "@reeka-office/domain-point"

export async function register() {
  const [
    { agentSchema, setup: setupAgent },
    { cmsSchema, setup: setupCms },
    { setup: setupIdentity },
    { planSchema, setup: setupPlan },
    { pointSchema, setup: setupPoint },
    { createDb },
    { getIdentityDB },
  ] = await Promise.all([
    import("@reeka-office/domain-agent"),
    import("@reeka-office/domain-cms"),
    import("@reeka-office/domain-identity"),
    import("@reeka-office/domain-plan"),
    import("@reeka-office/domain-point"),
    import("@/db"),
    import("@/db/identity"),
  ])

  const agentDb = createDb(agentSchema)
  setupAgent({ db: agentDb as unknown as AgentDB })

  const cmsDb = createDb(cmsSchema)
  setupCms({ db: cmsDb as unknown as CmsDB })

  const identityDb = getIdentityDB()
  setupIdentity({ db: identityDb as unknown as IdentityDB })

  const planDb = createDb(planSchema)
  setupPlan({ db: planDb as unknown as PlanDB })

  const pointDb = createDb(pointSchema)
  setupPoint({ db: pointDb as unknown as PointDB })
}
