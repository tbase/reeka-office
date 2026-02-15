"use server"

import { revalidatePath } from "next/cache"
import {
  ListCategoriesQuery,
  ListContentsQuery,
  CreateCategoryCommand,
  UpdateCategoryCommand,
  DeleteCategoryCommand,
  CreateContentCommand,
  UpdateContentCommand,
  DeleteContentCommand,
  type CreateContentInput,
  type UpdateContentInput,
} from "@reeka-office/domain-cms"

const PATH = "/cms/services"

export async function listCategories() {
  return new ListCategoriesQuery().query()
}

export async function listContents() {
  return new ListContentsQuery().query()
}

export async function createCategory(name: string) {
  const id = await new CreateCategoryCommand({ name }).execute()
  revalidatePath(PATH)
  return id
}

export async function updateCategory(id: number, name: string) {
  const ok = await new UpdateCategoryCommand({ id, name }).execute()
  revalidatePath(PATH)
  return ok
}

export async function deleteCategory(id: number) {
  const ok = await new DeleteCategoryCommand({ id }).execute()
  revalidatePath(PATH)
  return ok
}

export async function createContent(input: CreateContentInput) {
  const id = await new CreateContentCommand(input).execute()
  revalidatePath(PATH)
  return id
}

export async function updateContent(input: UpdateContentInput) {
  const ok = await new UpdateContentCommand(input).execute()
  revalidatePath(PATH)
  return ok
}

export async function deleteContent(id: number) {
  const ok = await new DeleteContentCommand({ id }).execute()
  revalidatePath(PATH)
  return ok
}
