"use client"

import type { ProductFormValue } from "./product-form"
import { ProductForm } from "./product-form"

export function ProductFormEdit({
  id,
  value,
  action,
  onSuccess,
}: {
  id: string
  value: ProductFormValue
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>
  onSuccess?: () => void
}) {
  return (
    <ProductForm
      action={action}
      id={id}
      value={value}
      onSuccess={onSuccess}
    />
  )
}
