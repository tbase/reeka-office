"use client"

import { useRouter } from "next/navigation"

import { PointItemForm } from "./point-item-form"

export function PointItemFormNew({
  id,
  action,
}: {
  id: string
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>
}) {
  const router = useRouter()

  function handleSuccess() {
    router.push("/points/items")
  }

  return <PointItemForm action={action} id={id} onSuccess={handleSuccess} />
}
