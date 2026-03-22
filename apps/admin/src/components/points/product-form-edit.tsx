"use client"

import type { UpdateProductAction } from "@/actions/points/product-actions"
import { updateProductActionSchema } from "@/actions/points/form-schemas"

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
  action: UpdateProductAction
  onSuccess?: () => void
}) {
  return (
    <ProductForm
      action={action}
      schema={updateProductActionSchema}
      id={id}
      value={value}
      onSuccess={onSuccess}
    />
  )
}
