"use client"

import { useRouter } from "next/navigation"

import type { UpdateCustomerTypeAction } from "@/actions/crm/customer-type-actions"
import { updateCustomerTypeActionSchema } from "@/actions/crm/form-schemas"
import { CustomerTypeForm, type CustomerTypeFormValue } from "@/components/crm/customer-type-form"

export function CustomerTypeFormEdit({
  id,
  action,
  value,
}: {
  id: string
  action: UpdateCustomerTypeAction
  value: CustomerTypeFormValue & { id: number }
}) {
  const router = useRouter()

  return (
    <CustomerTypeForm
      id={id}
      action={action}
      schema={updateCustomerTypeActionSchema}
      value={value}
      onSuccess={() => router.push("/crm/customer-types")}
    />
  )
}
