export async function register() {
  const [{ cmsSchema, setup: setupCms }, { pointSchema, setup: setupPoint }, { createDb }] = await Promise.all([
    import("@reeka-office/domain-cms"),
    import("@reeka-office/domain-point"),
    import("@/db"),
  ])

  const cmsDb = createDb(cmsSchema)
  setupCms({ db: cmsDb })

  const pointDb = createDb(pointSchema)
  setupPoint({ db: pointDb })
}
