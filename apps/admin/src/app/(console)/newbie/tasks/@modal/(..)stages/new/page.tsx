import { NewbieStageFormDialog } from "../../../../stages/@modal/(.)new/form-dialog"

function parseRedirectTo(value: string | undefined): string {
  if (!value || !value.startsWith("/")) {
    return "/newbie/tasks"
  }

  return value
}

export default async function NewbieTaskStageNewModal({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo: redirectToParam } = await searchParams
  const redirectTo = parseRedirectTo(redirectToParam)

  return <NewbieStageFormDialog redirectTo={redirectTo} />
}
