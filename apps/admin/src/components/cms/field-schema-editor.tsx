"use client"

import {
  AlignLeftIcon,
  CalendarIcon,
  CheckSquare2Icon,
  HashIcon,
  ImageIcon,
  PencilIcon,
  PlusIcon,
  ToggleLeftIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"

import type { FieldSchemaItem, FieldSchemaItemCommon, FieldSchemaItemOptions } from "@reeka-office/domain-cms"

import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { SimpleSelect } from "@/components/ui/simple-select"
import { Textarea } from "@/components/ui/textarea"

// --- Types ---

type FieldType =
  | "text"
  | "textarea"
  | "image"
  | "number"
  | "date"
  | "options"
  | "switch"

type FieldRow = {
  id: string
  field: FieldSchemaItem
}

type SheetMode =
  | { type: "edit"; rowId: string }
  | { type: "add"; draft: FieldSchemaItem }
  | null

type OptionsPropsFormProps = {
  props: FieldSchemaItemOptions["props"]
  onChange: (props: FieldSchemaItemOptions["props"]) => void
  optionsSyncRef: React.MutableRefObject<string[] | null>
}

type FieldSchemaEditorProps = {
  inputName: string
  defaultValue?: FieldSchemaItem[]
}

// --- Constants ---

const LABEL_UNNAMED = "未命名字段"
const OPTIONS_PLACEHOLDER = "选项A\n选项B\n选项C"
const OPTIONS_HELP = "每行一个选项。"

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "文本",
  textarea: "多行文本",
  image: "图片",
  number: "数字",
  date: "日期",
  options: "选项",
  switch: "开关",
}

const FIELD_TYPE_ICON: Record<FieldType, ReactNode> = {
  text: <TypeIcon className="size-4" />,
  textarea: <AlignLeftIcon className="size-4" />,
  image: <ImageIcon className="size-4" />,
  number: <HashIcon className="size-4" />,
  date: <CalendarIcon className="size-4" />,
  options: <CheckSquare2Icon className="size-4" />,
  switch: <ToggleLeftIcon className="size-4" />,
}

const FIELD_TYPE_ITEMS = (Object.keys(FIELD_TYPE_LABEL) as FieldType[]).map((type) => ({
  value: type,
  label: FIELD_TYPE_LABEL[type],
  icon: FIELD_TYPE_ICON[type],
}))

const EMPTY_FIELD: FieldSchemaItemCommon = {
  name: "",
  label: "",
  type: "text",
  required: false,
  placeholder: "",
}

// --- Helpers ---

function parseOptions(text: string): string[] {
  return text.split("\n").map((o) => o.trim()).filter(Boolean)
}

function normalize(items: FieldSchemaItem[]): FieldSchemaItem[] {
  return items
    .map((item): FieldSchemaItem | null => {
      const name = item.name.trim()
      const label = item.label.trim()
      if (!name || !label) return null
      if (item.type === "options") {
        return {
          name,
          label,
          type: "options",
          required: item.required ?? false,
          props: {
            options: item.props.options.map((o) => o.trim()).filter(Boolean),
            multiple: item.props.multiple ?? false,
          },
        }
      }
      return {
        name,
        label,
        type: item.type,
        required: item.required ?? false,
        placeholder: item.placeholder?.trim() || undefined,
      }
    })
    .filter((item): item is FieldSchemaItem => item !== null)
}

function createFieldRow(field: FieldSchemaItem): FieldRow {
  return { id: crypto.randomUUID(), field }
}

function changeFieldType(field: FieldSchemaItem, nextType: FieldType): FieldSchemaItem {
  const base = { name: field.name, label: field.label, required: field.required }
  if (nextType === "options") {
    return { ...base, type: "options", props: { options: [], multiple: false } }
  }
  return {
    ...base,
    type: nextType,
    placeholder: field.type !== "options" ? field.placeholder : undefined,
  }
}

function getEffectiveField(
  field: FieldSchemaItem,
  optionsSyncRef: React.MutableRefObject<string[] | null>,
): FieldSchemaItem {
  if (field.type === "options" && optionsSyncRef.current) {
    return { ...field, props: { ...field.props, options: optionsSyncRef.current } }
  }
  return field
}

function OptionsPropsForm({ props, onChange, optionsSyncRef }: OptionsPropsFormProps) {
  const [rawValue, setRawValue] = useState(() => props.options.join("\n"))

  // Keep ref in sync so "完成" gets latest options without blur
  useEffect(() => {
    optionsSyncRef.current = parseOptions(rawValue)
  }, [rawValue, optionsSyncRef])

  const syncOptionsToParent = (text: string) => {
    onChange({ ...props, options: parseOptions(text) })
  }

  return (
    <>
      <Field>
        <FieldContent>
          <FieldLabel htmlFor="field-options">选项列表</FieldLabel>
          <Textarea
            id="field-options"
            placeholder={OPTIONS_PLACEHOLDER}
            rows={4}
            value={rawValue}
            onChange={(e) => setRawValue(e.target.value)}
            onBlur={(e) => syncOptionsToParent(e.target.value)}
          />
          <FieldDescription>{OPTIONS_HELP}</FieldDescription>
        </FieldContent>
      </Field>
      <Field>
        <FieldContent>
          <FieldLabel>选择模式</FieldLabel>
          <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
            <input
              type="checkbox"
              checked={props.multiple ?? false}
              onChange={(e) => onChange({ ...props, multiple: e.target.checked })}
            />
            允许多选
          </label>
          <FieldDescription>
            勾选后用户可同时选择多个选项，否则仅能选一个。
          </FieldDescription>
        </FieldContent>
      </Field>
    </>
  )
}

export function FieldSchemaEditor({ inputName, defaultValue }: FieldSchemaEditorProps) {
  const [rows, setRows] = useState<FieldRow[]>(
    defaultValue?.length ? defaultValue.map(createFieldRow) : [],
  )
  const [sheetMode, setSheetMode] = useState<SheetMode>(null)
  const optionsSyncRef = useRef<string[] | null>(null)

  const serialized = useMemo(
    () => JSON.stringify(normalize(rows.map((row) => row.field))),
    [rows],
  )

  const isAdding = sheetMode?.type === "add"

  const formField = useMemo(() => {
    if (sheetMode?.type === "edit") {
      return rows.find((r) => r.id === sheetMode.rowId)?.field ?? null
    }
    if (sheetMode?.type === "add") return sheetMode.draft
    return null
  }, [sheetMode, rows])

  const updateFormField = (updater: (field: FieldSchemaItem) => FieldSchemaItem) => {
    if (sheetMode?.type === "edit") {
      setRows((prev) =>
        prev.map((row) =>
          row.id === sheetMode.rowId ? { ...row, field: updater(row.field) } : row,
        ),
      )
    }
    if (sheetMode?.type === "add") {
      setSheetMode({ type: "add", draft: updater(sheetMode.draft) })
    }
  }

  const deleteRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId))
    setSheetMode((prev) =>
      prev?.type === "edit" && prev.rowId === rowId ? null : prev,
    )
  }

  const closeSheet = () => setSheetMode(null)

  const handleComplete = () => {
    if (!formField) return
    const effectiveField = getEffectiveField(formField, optionsSyncRef)

    if (sheetMode?.type === "add") {
      const name = effectiveField.name.trim()
      const label = effectiveField.label.trim()
      if (name && label) {
        setRows((prev) => [...prev, createFieldRow({ ...effectiveField, name, label })])
      }
    } else if (sheetMode?.type === "edit" && effectiveField !== formField) {
      setRows((prev) =>
        prev.map((row) =>
          row.id === sheetMode.rowId ? { ...row, field: effectiveField } : row,
        ),
      )
    }
    closeSheet()
  }

  const handleDeleteInSheet = () => {
    if (sheetMode?.type === "edit") deleteRow(sheetMode.rowId)
    else closeSheet()
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={inputName} value={serialized} />

      <div className="space-y-2">
        {rows.map((row) => {
          const { field } = row
          const name = field.name.trim()
          const label = field.label.trim()
          const title = label || name || LABEL_UNNAMED

          return (
            <div
              key={row.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2"
            >
              <span className="text-muted-foreground shrink-0">
                {FIELD_TYPE_ICON[field.type]}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">
                <span className="font-medium">{title}</span>
                {name && (
                  <span className="text-muted-foreground ml-1">({name})</span>
                )}
                {field.required && (
                  <span className="ml-0.5 text-red-500">*</span>
                )}
                {field.type === "options" && (
                  <span className="text-muted-foreground ml-1.5 text-xs">
                    {field.props.multiple ? "多选" : "单选"}
                  </span>
                )}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground shrink-0 size-7"
                onClick={() => setSheetMode({ type: "edit", rowId: row.id })}
              >
                <PencilIcon className="size-3.5" />
              </Button>
            </div>
          )
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => setSheetMode({ type: "add", draft: { ...EMPTY_FIELD } })}
        >
          <PlusIcon className="size-4" />
          新增字段
        </Button>
      </div>

      <Sheet
        open={sheetMode !== null}
        onOpenChange={(open) => {
          if (!open) closeSheet()
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          {formField && (
            <>
              <SheetHeader>
                <SheetTitle>{isAdding ? "新增字段" : "编辑字段"}</SheetTitle>
                <SheetDescription>
                  {isAdding
                    ? "填写完成后点击「完成」才会添加到列表。"
                    : "调整字段定义后会实时同步到列表。"}
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 px-4">
                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="field-label">展示名</FieldLabel>
                    <Input
                      id="field-label"
                      placeholder="例如 价格"
                      value={formField.label}
                      onChange={(e) =>
                        updateFormField((field) => ({ ...field, label: e.target.value }))
                      }
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="field-name">字段名</FieldLabel>
                    <Input
                      id="field-name"
                      placeholder="例如 price"
                      value={formField.name}
                      onChange={(e) =>
                        updateFormField((field) => ({ ...field, name: e.target.value }))
                      }
                    />
                    <FieldDescription>用于存储，建议英文且不带空格。</FieldDescription>
                  </FieldContent>
                </Field>

                {formField.type !== "options" && (
                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor="field-placeholder">占位符</FieldLabel>
                      <Input
                        id="field-placeholder"
                        placeholder="占位符（可选）"
                        value={formField.placeholder ?? ""}
                        onChange={(e) =>
                          updateFormField((field) => {
                            if (field.type === "options") return field
                            return { ...field, placeholder: e.target.value }
                          })
                        }
                      />
                    </FieldContent>
                  </Field>
                )}

                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="field-required">校验规则</FieldLabel>
                    <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                      <input
                        id="field-required"
                        type="checkbox"
                        checked={formField.required ?? false}
                        onChange={(e) =>
                          updateFormField((field) => ({ ...field, required: e.target.checked }))
                        }
                      />
                      设为必填项
                    </label>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>字段类型</FieldLabel>
                    <SimpleSelect
                      placeholder="请选择字段类型"
                      value={formField.type}
                      onValueChange={(value) =>
                        updateFormField((field) => changeFieldType(field, value as FieldType))
                      }
                      items={FIELD_TYPE_ITEMS}
                    />
                  </FieldContent>
                </Field>

                {formField.type === "options" && (
                  <OptionsPropsForm
                    key={
                      sheetMode?.type === "edit"
                        ? sheetMode.rowId
                        : "add"
                    }
                    props={formField.props}
                    onChange={(nextProps) =>
                      updateFormField((field) => {
                        if (field.type !== "options") return field
                        return { ...field, props: nextProps }
                      })
                    }
                    optionsSyncRef={optionsSyncRef}
                  />
                )}
              </div>

              <SheetFooter>
                {!isAdding && (
                  <Button type="button" variant="destructive" onClick={handleDeleteInSheet}>
                    <Trash2Icon className="size-4" />
                    删除字段
                  </Button>
                )}
                <Button type="button" variant="outline" onClick={handleComplete}>
                  完成
                </Button>
              </SheetFooter>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
