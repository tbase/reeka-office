import { DEFAULT_SERVER_ERROR_MESSAGE, createSafeActionClient } from "next-safe-action"

import { getRequiredAdminContext } from "@/lib/admin-context"

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error("Action error:", error)

    if (error instanceof Error && error.message) {
      return error.message
    }

    return DEFAULT_SERVER_ERROR_MESSAGE
  },
})

export const adminActionClient = actionClient.use(async ({ next }) => {
  const admin = await getRequiredAdminContext()

  return next({
    ctx: {
      admin,
    },
  })
})
