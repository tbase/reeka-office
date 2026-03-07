import { NewbieStageFormDialog } from "./form-dialog"

function parseRedirectTo(value: string | undefined): string | undefined {
  if (!value || !value.startsWith("/")) {
    return undefined
  }

  return value
}

export default async function NewbieStageNewModal({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo: redirectToParam } = await searchParams
  const redirectTo = parseRedirectTo(redirectToParam)

  return <NewbieStageFormDialog redirectTo={redirectTo} />
}
