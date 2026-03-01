"use client"

import { useRouter } from "next/navigation"

import { ProductForm } from "./product-form"

export function ProductFormNew({
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
    router.push("/points/products")
  }

  return <ProductForm action={action} id={id} onSuccess={handleSuccess} />
}
