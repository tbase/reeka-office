import { DEFAULT_SERVER_ERROR_MESSAGE, createSafeActionClient } from "next-safe-action"

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    console.error("Action error:", error)

    if (error instanceof Error && error.message) {
      return error.message
    }

    return DEFAULT_SERVER_ERROR_MESSAGE
  },
})
