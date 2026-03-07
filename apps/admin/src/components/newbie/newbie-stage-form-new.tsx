"use client"

import { useRouter } from "next/navigation"

import { NewbieStageForm } from "./newbie-stage-form"

export function NewbieStageFormNew({
  id,
  action,
  redirectTo,
}: {
  id: string
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>
  redirectTo?: string
}) {
  const router = useRouter()

  function handleSuccess() {
    router.push(redirectTo ?? "/newbie/stages")
  }

  return <NewbieStageForm action={action} id={id} onSuccess={handleSuccess} />
}
