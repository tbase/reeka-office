"use server"

import { revalidatePath } from "next/cache"

import {
  CreateCustomerTypeConfigCommand,
  UpdateCustomerTypeConfigCommand,
} from "@reeka-office/domain-crm"

import {
  createCustomerTypeActionSchema,
  updateCustomerTypeActionSchema,
} from "@/actions/crm/form-schemas"
import { adminActionClient } from "@/lib/safe-action"

function revalidateCustomerTypePaths(customerTypeId?: number) {
  revalidatePath("/crm/customer-types")
  if (customerTypeId) {
    revalidatePath(`/crm/customer-types/${customerTypeId}/edit`)
  }
}

export const createCustomerTypeAction = adminActionClient
  .inputSchema(createCustomerTypeActionSchema)
  .action(async ({ parsedInput }) => {
    const customerTypeId = await new CreateCustomerTypeConfigCommand(parsedInput).execute()

    revalidateCustomerTypePaths(customerTypeId)
    return { success: true, customerTypeId }
  })

export const updateCustomerTypeAction = adminActionClient
  .inputSchema(updateCustomerTypeActionSchema)
  .action(async ({ parsedInput }) => {
    await new UpdateCustomerTypeConfigCommand(parsedInput).execute()

    revalidateCustomerTypePaths(parsedInput.id)
    return { success: true }
  })

export type CreateCustomerTypeAction = typeof createCustomerTypeAction
export type UpdateCustomerTypeAction = typeof updateCustomerTypeAction
export type CustomerTypeFormAction = CreateCustomerTypeAction | UpdateCustomerTypeAction
