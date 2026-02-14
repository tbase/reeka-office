"use server"

import { revalidatePath } from "next/cache"
import {
  ListServiceCategoriesQuery,
  ListServiceItemsQuery,
  CreateServiceCategoryCommand,
  UpdateServiceCategoryCommand,
  DeleteServiceCategoryCommand,
  CreateServiceItemCommand,
  UpdateServiceItemCommand,
  DeleteServiceItemCommand,
  type CreateServiceItemInput,
  type UpdateServiceItemInput,
} from "@reeka-office/domain-cms"

const PATH = "/cms/services"

export async function listCategories() {
  return new ListServiceCategoriesQuery().query()
}

export async function listServiceItems() {
  return new ListServiceItemsQuery().query()
}

export async function createCategory(name: string) {
  const id = await new CreateServiceCategoryCommand({ name }).execute()
  revalidatePath(PATH)
  return id
}

export async function updateCategory(id: number, name: string) {
  const ok = await new UpdateServiceCategoryCommand({ id, name }).execute()
  revalidatePath(PATH)
  return ok
}

export async function deleteCategory(id: number) {
  const ok = await new DeleteServiceCategoryCommand({ id }).execute()
  revalidatePath(PATH)
  return ok
}

export async function createServiceItem(input: CreateServiceItemInput) {
  const id = await new CreateServiceItemCommand(input).execute()
  revalidatePath(PATH)
  return id
}

export async function updateServiceItem(input: UpdateServiceItemInput) {
  const ok = await new UpdateServiceItemCommand(input).execute()
  revalidatePath(PATH)
  return ok
}

export async function deleteServiceItem(id: number) {
  const ok = await new DeleteServiceItemCommand({ id }).execute()
  revalidatePath(PATH)
  return ok
}
