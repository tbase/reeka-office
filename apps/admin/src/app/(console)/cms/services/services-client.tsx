"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import {
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  Settings2Icon,
  TrashIcon,
} from "lucide-react"
import type { ServiceCategoryRow, ServiceItemRow } from "@reeka-office/domain-cms"
import { parseAsInteger, useQueryState } from "nuqs"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

import {
  createCategory,
  createServiceItem,
  deleteCategory,
  deleteServiceItem,
  updateCategory,
  updateServiceItem,
} from "./actions"

interface CmsServicesClientProps {
  categories: ServiceCategoryRow[]
  items: ServiceItemRow[]
}

interface ItemFormState {
  name: string
  categoryId: number
  content: string
  wechatId: string
  wechatQrCode: string
  contactName: string
  contactPhone: string
}

const defaultFormState: ItemFormState = {
  name: "",
  categoryId: 0,
  content: "",
  wechatId: "",
  wechatQrCode: "",
  contactName: "",
  contactPhone: "",
}

export function CmsServicesClient({ categories, items }: CmsServicesClientProps) {
  const [pending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState("")

  const [activeCategoryId, setActiveCategoryId] = useQueryState(
    "category",
    parseAsInteger.withDefault(0).withOptions({ history: "push" })
  )

  const resolvedCategoryId =
    activeCategoryId === 0 || categories.some((category) => category.id === activeCategoryId)
      ? activeCategoryId
      : 0

  const filteredItems =
    resolvedCategoryId === 0
      ? items
      : items.filter((item) => item.categoryId === resolvedCategoryId)

  const categoryMap = new Map(categories.map((category) => [category.id, category.name]))

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [addingCategory, setAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [renamingCategory, setRenamingCategory] = useState<{ id: number; name: string } | null>(null)
  const addCategoryInputRef = useRef<HTMLInputElement>(null)
  const renameCategoryInputRef = useRef<HTMLInputElement>(null)

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ServiceItemRow | null>(null)
  const [itemForm, setItemForm] = useState<ItemFormState>(defaultFormState)

  const [deleteTarget, setDeleteTarget] = useState<{
    type: "category" | "item"
    id: number
    name: string
  } | null>(null)

  useEffect(() => {
    if (addingCategory) {
      addCategoryInputRef.current?.focus()
    }
  }, [addingCategory])

  useEffect(() => {
    if (renamingCategory) {
      renameCategoryInputRef.current?.focus()
    }
  }, [renamingCategory])

  function withServerAction(action: () => Promise<void>) {
    setErrorMessage("")
    startTransition(async () => {
      try {
        await action()
      } catch (error) {
        const fallback = "操作失败，请稍后重试"
        if (error instanceof Error && error.message) {
          setErrorMessage(error.message)
          return
        }
        setErrorMessage(fallback)
      }
    })
  }

  function handleAddCategory() {
    const name = newCategoryName.trim()
    if (!name) {
      return
    }

    withServerAction(async () => {
      await createCategory(name)
      setNewCategoryName("")
      setAddingCategory(false)
    })
  }

  function handleRenameCategory() {
    if (!renamingCategory) {
      return
    }

    const nextName = renamingCategory.name.trim()
    if (!nextName) {
      return
    }

    withServerAction(async () => {
      await updateCategory(renamingCategory.id, nextName)
      setRenamingCategory(null)
    })
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) {
      return
    }

    withServerAction(async () => {
      if (deleteTarget.type === "category") {
        await deleteCategory(deleteTarget.id)
        if (resolvedCategoryId === deleteTarget.id) {
          await setActiveCategoryId(0)
        }
      } else {
        await deleteServiceItem(deleteTarget.id)
      }
      setDeleteTarget(null)
    })
  }

  function openCreateItemSheet() {
    setEditingItem(null)
    setItemForm({
      ...defaultFormState,
      categoryId: resolvedCategoryId || categories[0]?.id || 0,
    })
    setSheetOpen(true)
  }

  function openEditItemSheet(item: ServiceItemRow) {
    setEditingItem(item)
    setItemForm({
      name: item.name,
      categoryId: item.categoryId,
      content: item.content,
      wechatId: item.wechatId ?? "",
      wechatQrCode: item.wechatQrCode ?? "",
      contactName: item.contactName ?? "",
      contactPhone: item.contactPhone ?? "",
    })
    setSheetOpen(true)
  }

  function handleSaveItem() {
    const name = itemForm.name.trim()
    const content = itemForm.content.trim()

    if (!name || !content || !itemForm.categoryId) {
      return
    }

    withServerAction(async () => {
      const payload = {
        categoryId: itemForm.categoryId,
        name,
        content,
        wechatId: itemForm.wechatId.trim() || null,
        wechatQrCode: itemForm.wechatQrCode.trim() || null,
        contactName: itemForm.contactName.trim() || null,
        contactPhone: itemForm.contactPhone.trim() || null,
      }

      if (editingItem) {
        await updateServiceItem({ id: editingItem.id, ...payload })
      } else {
        await createServiceItem(payload)
      }

      setSheetOpen(false)
    })
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="flex items-start gap-2" role="tablist" aria-label="服务分类">
          <div className="flex flex-1 flex-wrap gap-2">
            <Button
              variant={resolvedCategoryId === 0 ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategoryId(0)}
              role="tab"
              aria-selected={resolvedCategoryId === 0}
            >
              全部服务
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={resolvedCategoryId === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategoryId(category.id)}
                role="tab"
                aria-selected={resolvedCategoryId === category.id}
              >
                {category.name}
              </Button>
            ))}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="管理服务分类"
            onClick={() => setCategoryDialogOpen(true)}
          >
            <Settings2Icon className="size-4" />
          </Button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{filteredItems.length} 条</Badge>
          </div>
          <Button size="sm" onClick={openCreateItemSheet}>
            <PlusIcon className="size-4" />
            新增服务
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredItems.map((item) => (
            <article key={item.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="truncate font-medium">{item.name}</h3>
                  <Badge variant="secondary">{categoryMap.get(item.categoryId) ?? "未知分类"}</Badge>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <EllipsisIcon className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditItemSheet(item)}>
                      <PencilIcon />
                      编辑
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() =>
                        setDeleteTarget({
                          type: "item",
                          id: item.id,
                          name: item.name,
                        })
                      }
                    >
                      <TrashIcon />
                      删除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <dl className="mt-3 space-y-2 text-sm text-muted-foreground">
                {item.wechatId ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt>微信号</dt>
                    <dd className="font-medium text-foreground">{item.wechatId}</dd>
                  </div>
                ) : null}
                {item.contactName ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt>联系人</dt>
                    <dd className="font-medium text-foreground">{item.contactName}</dd>
                  </div>
                ) : null}
                {item.contactPhone ? (
                  <div className="flex items-center justify-between gap-4">
                    <dt>联系电话</dt>
                    <dd className="font-medium text-foreground">{item.contactPhone}</dd>
                  </div>
                ) : null}
              </dl>
            </article>
          ))}

          {filteredItems.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground sm:col-span-2 lg:col-span-3">
              当前分类暂无服务条目
            </div>
          ) : null}
        </div>
      </section>

      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}

      <AlertDialog
        open={categoryDialogOpen}
        onOpenChange={(open) => {
          setCategoryDialogOpen(open)
          if (!open) {
            setAddingCategory(false)
            setRenamingCategory(null)
            setNewCategoryName("")
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>管理服务分类</AlertDialogTitle>
            <AlertDialogDescription>可在这里新增、重命名或删除分类。</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                {renamingCategory?.id === category.id ? (
                  <Input
                    ref={renameCategoryInputRef}
                    className="h-7 flex-1"
                    value={renamingCategory.name}
                    onChange={(event) =>
                      setRenamingCategory({
                        id: category.id,
                        name: event.target.value,
                      })
                    }
                    onBlur={handleRenameCategory}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleRenameCategory()
                      }

                      if (event.key === "Escape") {
                        setRenamingCategory(null)
                      }
                    }}
                    disabled={pending}
                  />
                ) : (
                  <span className="flex-1">{category.name}</span>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setRenamingCategory({
                      id: category.id,
                      name: category.name,
                    })
                  }
                  disabled={pending}
                >
                  <PencilIcon className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() =>
                    setDeleteTarget({
                      type: "category",
                      id: category.id,
                      name: category.name,
                    })
                  }
                  disabled={pending}
                >
                  <TrashIcon className="size-3.5" />
                </Button>
              </div>
            ))}

            {addingCategory ? (
              <div className="flex items-center gap-2">
                <Input
                  ref={addCategoryInputRef}
                  className="h-8 flex-1"
                  value={newCategoryName}
                  placeholder="输入分类名称"
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleAddCategory()
                    }

                    if (event.key === "Escape") {
                      setAddingCategory(false)
                      setNewCategoryName("")
                    }
                  }}
                  disabled={pending}
                />
                <Button size="sm" onClick={handleAddCategory} disabled={pending}>
                  添加
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setAddingCategory(false)
                    setNewCategoryName("")
                  }}
                >
                  取消
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full" onClick={() => setAddingCategory(true)}>
                <PlusIcon className="size-4" />
                新增分类
              </Button>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>关闭</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingItem ? "编辑服务" : "新增服务"}</SheetTitle>
            <SheetDescription>{editingItem ? "修改当前条目信息" : "填写信息并创建服务条目"}</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4">
            <FieldGroup>
              <Field>
                <FieldLabel>服务名称</FieldLabel>
                <Input
                  value={itemForm.name}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="输入服务名称"
                />
              </Field>

              <Field>
                <FieldLabel>所属分类</FieldLabel>
                <Select
                  value={itemForm.categoryId || undefined}
                  onValueChange={(value) => setItemForm((prev) => ({ ...prev, categoryId: Number(value) }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel>服务内容</FieldLabel>
                <Textarea
                  value={itemForm.content}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, content: event.target.value }))}
                  placeholder="输入服务内容说明"
                />
              </Field>

              <Field>
                <FieldLabel>微信号</FieldLabel>
                <Input
                  value={itemForm.wechatId}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, wechatId: event.target.value }))}
                  placeholder="选填"
                />
              </Field>

              <Field>
                <FieldLabel>微信二维码地址</FieldLabel>
                <Input
                  value={itemForm.wechatQrCode}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, wechatQrCode: event.target.value }))}
                  placeholder="选填"
                />
              </Field>

              <Field>
                <FieldLabel>联系人</FieldLabel>
                <Input
                  value={itemForm.contactName}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, contactName: event.target.value }))}
                  placeholder="选填"
                />
              </Field>

              <Field>
                <FieldLabel>联系电话</FieldLabel>
                <Input
                  value={itemForm.contactPhone}
                  onChange={(event) => setItemForm((prev) => ({ ...prev, contactPhone: event.target.value }))}
                  placeholder="选填"
                />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter>
            <SheetClose render={<Button variant="outline" />}>取消</SheetClose>
            <Button
              onClick={handleSaveItem}
              disabled={pending || categories.length === 0 || !itemForm.name.trim() || !itemForm.content.trim()}
            >
              {editingItem ? "保存" : "创建"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定删除{deleteTarget?.type === "category" ? "分类" : "服务"}「{deleteTarget?.name}」？该操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDeleteConfirm} disabled={pending}>
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
