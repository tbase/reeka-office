"use client"

import { useRouter } from "next/navigation"

import type { CreateProductAction } from "@/actions/points/product-actions"
import { createProductActionSchema } from "@/actions/points/form-schemas"

import { ProductForm } from "./product-form"

export function ProductFormNew({
  id,
  action,
}: {
  id: string
  action: CreateProductAction
}) {
  const router = useRouter()

  function handleSuccess() {
    router.push("/points/products")
  }

  return (
    <ProductForm
      action={action}
      schema={createProductActionSchema}
      id={id}
      onSuccess={handleSuccess}
    />
  )
}
