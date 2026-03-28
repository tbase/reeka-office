"use client"

import { useRouter } from "next/navigation"

import type { CreatePointItemAction } from "@/actions/points/item-actions"
import { createPointItemActionSchema } from "@/actions/points/form-schemas"

import { PointItemForm } from "./point-item-form"

export function PointItemFormNew({
  id,
  action,
  onSuccess,
}: {
  id: string
  action: CreatePointItemAction
  onSuccess?: () => void
}) {
  const router = useRouter()

  function handleSuccess() {
    onSuccess?.()
    if (!onSuccess) {
      router.push("/points/items")
    }
  }

  return (
    <PointItemForm
      action={action}
      schema={createPointItemActionSchema}
      id={id}
      onSuccess={handleSuccess}
    />
  )
}
