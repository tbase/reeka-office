"use client"

import { useRouter } from "next/navigation"

import type { CreateCustomerTypeAction } from "@/actions/crm/customer-type-actions"
import { createCustomerTypeActionSchema } from "@/actions/crm/form-schemas"
import { CustomerTypeForm } from "@/components/crm/customer-type-form"

export function CustomerTypeFormNew({
  id,
  action,
}: {
  id: string
  action: CreateCustomerTypeAction
}) {
  const router = useRouter()

  return (
    <CustomerTypeForm
      id={id}
      action={action}
      schema={createCustomerTypeActionSchema}
      onSuccess={() => router.push("/crm/customer-types")}
    />
  )
}
