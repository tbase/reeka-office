"use client"

import { useRouter } from "next/navigation"

import { NewbieStageForm } from "./newbie-stage-form"

export function NewbieStageFormNew({
  id,
  action,
  redirectTo,
  onSuccess,
}: {
  id: string
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>
  redirectTo?: string
  onSuccess?: () => void
}) {
  const router = useRouter()

  function handleSuccess() {
    if (onSuccess) {
      onSuccess()
    } else {
      router.push(redirectTo ?? "/newbie/stages")
    }
  }

  return <NewbieStageForm action={action} id={id} onSuccess={handleSuccess} />
}
