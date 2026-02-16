"use client"

import { useMemo, useState } from "react"
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldContent, FieldDescription, FieldLabel } from "@/components/ui/field"
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

type FieldType = "text" | "textarea" | "image" | "number" | "date" | "select" | "switch"

export type FieldSchemaItem = {
  name: string
  label: string
  type: FieldType
  required?: boolean
  options?: string[]
  placeholder?: string
}

type FieldRow = {
  id: string
  field: FieldSchemaItem
}

const FIELD_TYPES: FieldType[] = ["text", "textarea", "image", "number", "date", "select", "switch"]

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "文本",
  textarea: "多行文本",
  image: "图片",
  number: "数字",
  date: "日期",
  select: "下拉选择",
  switch: "开关",
}

function normalize(items: FieldSchemaItem[]): FieldSchemaItem[] {
  return items
    .map((item) => ({
      name: item.name.trim(),
      label: item.label.trim(),
      type: item.type,
      required: item.required ?? false,
      placeholder: item.placeholder?.trim() || undefined,
      options: item.type === "select"
        ? (item.options ?? []).map((opt) => opt.trim()).filter(Boolean)
        : undefined
    }))
    .filter((item) => item.name && item.label)
}

const EMPTY_FIELD: FieldSchemaItem = {
  name: "",
  label: "",
  type: "text",
  required: false,
  placeholder: ""
}

function createFieldRow(field: FieldSchemaItem): FieldRow {
  return {
    id: crypto.randomUUID(),
    field
  }
}

export function FieldSchemaEditor({
  inputName,
  defaultValue,
}: {
  inputName: string
  defaultValue?: FieldSchemaItem[]
}) {
  const [rows, setRows] = useState<FieldRow[]>(
    defaultValue?.length ? defaultValue.map((item) => createFieldRow(item)) : []
  )
  const [editingRowId, setEditingRowId] = useState<string | null>(null)

  const serialized = useMemo(() => JSON.stringify(normalize(rows.map((row) => row.field))), [rows])
  const editingRow = useMemo(
    () => rows.find((row) => row.id === editingRowId) ?? null,
    [rows, editingRowId]
  )

  const updateRow = (rowId: string, updater: (field: FieldSchemaItem) => FieldSchemaItem) => {
    setRows((current) => current.map((row) => (row.id === rowId ? { ...row, field: updater(row.field) } : row)))
  }

  const deleteRow = (rowId: string) => {
    setRows((current) => current.filter((row) => row.id !== rowId))
    setEditingRowId((current) => (current === rowId ? null : current))
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={inputName} value={serialized} />

      <div className="flex items-center justify-between gap-3 rounded-md border px-3 py-2">
        <div>
          <p className="text-sm font-medium">字段列表</p>
          <p className="text-muted-foreground text-xs">{rows.length} 个字段，点击编辑可打开侧边面板</p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            const row = createFieldRow(EMPTY_FIELD)
            setRows((current) => [...current, row])
            setEditingRowId(row.id)
          }}
        >
          <PlusIcon className="size-4" />
          新增字段
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm">
          暂无字段，点击下方按钮添加。
        </div>
      ) : null}

      <div className="space-y-2">
        {rows.map((row) => {
        const field = row.field
        const name = field.name.trim()
        const label = field.label.trim()
        const title = label || name || "未命名字段"

        return (
          <div key={row.id} className="rounded-md border p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">{title}</p>
                <p className="text-muted-foreground text-xs">
                  {name ? `字段名：${name}` : "字段名未填写"}
                </p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline">{FIELD_TYPE_LABEL[field.type]}</Badge>
                  <Badge variant={field.required ? "default" : "secondary"}>
                    {field.required ? "必填" : "可选"}
                  </Badge>
                  {field.type === "select" ? (
                    <Badge variant="secondary">选项 {(field.options ?? []).length} 个</Badge>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setEditingRowId(row.id)}>
                  <PencilIcon className="size-4" />
                  编辑
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    deleteRow(row.id)
                  }}
                >
                  <Trash2Icon className="size-4" />
                  删除
                </Button>
              </div>
            </div>
          </div>
        )
      })}
      </div>

      <Sheet
        open={editingRow !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRowId(null)
          }
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          {editingRow ? (
            <>
              <SheetHeader>
                <SheetTitle>编辑字段</SheetTitle>
                <SheetDescription>调整字段定义后会实时同步到列表。</SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4">
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="field-name">字段名</FieldLabel>
                    <Input
                      id="field-name"
                      placeholder="例如 price"
                      value={editingRow.field.name}
                      onChange={(event) => {
                        updateRow(editingRow.id, (field) => ({ ...field, name: event.target.value }))
                      }}
                    />
                    <FieldDescription>用于存储，建议英文且不带空格。</FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="field-label">展示名</FieldLabel>
                    <Input
                      id="field-label"
                      placeholder="例如 价格"
                      value={editingRow.field.label}
                      onChange={(event) => {
                        updateRow(editingRow.id, (field) => ({ ...field, label: event.target.value }))
                      }}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>字段类型</FieldLabel>
                    <Select
                      value={editingRow.field.type}
                      onValueChange={(value) => {
                        const nextType = value as FieldType
                        updateRow(editingRow.id, (field) => ({
                          ...field,
                          type: nextType,
                          options: nextType === "select" ? field.options ?? [] : undefined,
                        }))
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="请选择字段类型" />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {FIELD_TYPE_LABEL[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="field-placeholder">占位符</FieldLabel>
                    <Input
                      id="field-placeholder"
                      placeholder="占位符（可选）"
                      value={editingRow.field.placeholder ?? ""}
                      onChange={(event) => {
                        updateRow(editingRow.id, (field) => ({
                          ...field,
                          placeholder: event.target.value,
                        }))
                      }}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="field-required">校验规则</FieldLabel>
                    <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                      <input
                        id="field-required"
                        type="checkbox"
                        checked={editingRow.field.required ?? false}
                        onChange={(event) => {
                          updateRow(editingRow.id, (field) => ({ ...field, required: event.target.checked }))
                        }}
                      />
                      设为必填项
                    </label>
                  </FieldContent>
                </Field>

                {editingRow.field.type === "select" ? (
                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor="field-options">下拉选项</FieldLabel>
                      <Input
                        id="field-options"
                        placeholder="选项（英文逗号分隔）"
                        value={(editingRow.field.options ?? []).join(",")}
                        onChange={(event) => {
                          updateRow(editingRow.id, (field) => ({
                            ...field,
                            options: event.target.value
                              .split(",")
                              .map((option) => option.trim())
                              .filter(Boolean),
                          }))
                        }}
                      />
                    </FieldContent>
                  </Field>
                ) : null}
              </div>

              <SheetFooter>
                <Button type="button" variant="destructive" onClick={() => deleteRow(editingRow.id)}>
                  <Trash2Icon className="size-4" />
                  删除字段
                </Button>
                <SheetClose render={<Button type="button" variant="outline" />}>完成</SheetClose>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  )
}
