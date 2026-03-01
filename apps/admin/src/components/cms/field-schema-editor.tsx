"use client";

import {
  AlignLeftIcon,
  CalendarIcon,
  HashIcon,
  ImageIcon,
  ListIcon,
  PencilIcon,
  PlusIcon,
  ToggleLeftIcon,
  Trash2Icon,
  TypeIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SimpleSelect } from "@/components/ui/simple-select";

type FieldType =
  | "text"
  | "textarea"
  | "image"
  | "number"
  | "date"
  | "select"
  | "switch";

export type FieldSchemaItem = {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: string[];
  placeholder?: string;
};

type FieldRow = {
  id: string;
  field: FieldSchemaItem;
};

const FIELD_TYPES: FieldType[] = [
  "text",
  "textarea",
  "image",
  "number",
  "date",
  "select",
  "switch",
];

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  text: "文本",
  textarea: "多行文本",
  image: "图片",
  number: "数字",
  date: "日期",
  select: "下拉选择",
  switch: "开关",
};

const FIELD_TYPE_ICON: Record<FieldType, ReactNode> = {
  text: <TypeIcon className="size-4" />,
  textarea: <AlignLeftIcon className="size-4" />,
  image: <ImageIcon className="size-4" />,
  number: <HashIcon className="size-4" />,
  date: <CalendarIcon className="size-4" />,
  select: <ListIcon className="size-4" />,
  switch: <ToggleLeftIcon className="size-4" />,
};

function normalize(items: FieldSchemaItem[]): FieldSchemaItem[] {
  return items
    .map((item) => ({
      name: item.name.trim(),
      label: item.label.trim(),
      type: item.type,
      required: item.required ?? false,
      placeholder: item.placeholder?.trim() || undefined,
      options:
        item.type === "select"
          ? (item.options ?? []).map((opt) => opt.trim()).filter(Boolean)
          : undefined,
    }))
    .filter((item) => item.name && item.label);
}

const EMPTY_FIELD: FieldSchemaItem = {
  name: "",
  label: "",
  type: "text",
  required: false,
  placeholder: "",
};

function createFieldRow(field: FieldSchemaItem): FieldRow {
  return {
    id: crypto.randomUUID(),
    field,
  };
}

type SheetMode =
  | { type: "edit"; rowId: string }
  | { type: "add"; draft: FieldSchemaItem }
  | null;

export function FieldSchemaEditor({
  inputName,
  defaultValue,
}: {
  inputName: string;
  defaultValue?: FieldSchemaItem[];
}) {
  const [rows, setRows] = useState<FieldRow[]>(
    defaultValue?.length
      ? defaultValue.map((item) => createFieldRow(item))
      : [],
  );
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);

  const serialized = useMemo(
    () => JSON.stringify(normalize(rows.map((row) => row.field))),
    [rows],
  );
  const isAdding = sheetMode?.type === "add";
  const formField = useMemo(() => {
    if (sheetMode?.type === "edit") {
      const row = rows.find((r) => r.id === sheetMode.rowId);
      return row?.field ?? null;
    }
    if (sheetMode?.type === "add") return sheetMode.draft;
    return null;
  }, [sheetMode, rows]);

  const updateFormField = (
    updater: (field: FieldSchemaItem) => FieldSchemaItem,
  ) => {
    if (sheetMode?.type === "edit") {
      setRows((current) =>
        current.map((row) =>
          row.id === sheetMode.rowId
            ? { ...row, field: updater(row.field) }
            : row,
        ),
      );
    }
    if (sheetMode?.type === "add") {
      setSheetMode({ type: "add", draft: updater(sheetMode.draft) });
    }
  };

  const deleteRow = (rowId: string) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
    setSheetMode((current) =>
      current?.type === "edit" && current.rowId === rowId ? null : current,
    );
  };

  const closeSheet = () => setSheetMode(null);

  const handleComplete = () => {
    if (!formField) return;
    if (sheetMode?.type === "add") {
      const name = formField.name.trim();
      const label = formField.label.trim();
      if (name && label) {
        setRows((current) => [
          ...current,
          createFieldRow({ ...formField, name, label }),
        ]);
      }
    }
    closeSheet();
  };

  const handleDeleteInSheet = () => {
    if (sheetMode?.type === "edit") {
      deleteRow(sheetMode.rowId);
    } else {
      closeSheet();
    }
  };

  return (
    <div className="space-y-3">
      <input type="hidden" name={inputName} value={serialized} />

      <div className="space-y-2">
        {rows.map((row) => {
          const field = row.field;
          const name = field.name.trim();
          const label = field.label.trim();
          const title = label || name || "未命名字段";

          return (
            <div key={row.id} className="rounded-md border p-3">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-muted-foreground text-xs">
                    {name ? `字段名：${name}` : "字段名未填写"}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="inline-flex items-center gap-1.5">
                      {FIELD_TYPE_ICON[field.type]}
                      {FIELD_TYPE_LABEL[field.type]}
                    </Badge>
                    <Badge variant={field.required ? "default" : "secondary"}>
                      {field.required ? "必填" : "可选"}
                    </Badge>
                    {field.type === "select" ? (
                      <Badge variant="secondary">
                        选项 {(field.options ?? []).length} 个
                      </Badge>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setSheetMode({ type: "edit", rowId: row.id })
                    }
                  >
                    <PencilIcon className="size-4" />
                    编辑
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      deleteRow(row.id);
                    }}
                  >
                    <Trash2Icon className="size-4" />
                    删除
                  </Button>
                </div>
              </div>
            </div>
          );
        })}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() =>
            setSheetMode({ type: "add", draft: { ...EMPTY_FIELD } })
          }
        >
          <PlusIcon className="size-4" />
          新增字段
        </Button>
      </div>

      <Sheet
        open={sheetMode !== null}
        onOpenChange={(open) => {
          if (!open) closeSheet();
        }}
      >
        <SheetContent side="right" className="w-full sm:max-w-lg">
          {formField ? (
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
                    <FieldLabel htmlFor="field-name">字段名</FieldLabel>
                    <Input
                      id="field-name"
                      placeholder="例如 price"
                      value={formField.name}
                      onChange={(event) => {
                        updateFormField((field) => ({
                          ...field,
                          name: event.target.value,
                        }));
                      }}
                    />
                    <FieldDescription>
                      用于存储，建议英文且不带空格。
                    </FieldDescription>
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="field-label">展示名</FieldLabel>
                    <Input
                      id="field-label"
                      placeholder="例如 价格"
                      value={formField.label}
                      onChange={(event) => {
                        updateFormField((field) => ({
                          ...field,
                          label: event.target.value,
                        }));
                      }}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel>字段类型</FieldLabel>
                    <SimpleSelect
                      placeholder="请选择字段类型"
                      value={formField.type}
                      onValueChange={(value) => {
                        const nextType = value as FieldType;
                        updateFormField((field) => ({
                          ...field,
                          type: nextType,
                          options:
                            nextType === "select"
                              ? (field.options ?? [])
                              : undefined,
                        }));
                      }}
                      items={FIELD_TYPES.map((type) => ({
                        value: type,
                        label: FIELD_TYPE_LABEL[type],
                        icon: FIELD_TYPE_ICON[type],
                      }))}
                    />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldContent>
                    <FieldLabel htmlFor="field-placeholder">占位符</FieldLabel>
                    <Input
                      id="field-placeholder"
                      placeholder="占位符（可选）"
                      value={formField.placeholder ?? ""}
                      onChange={(event) => {
                        updateFormField((field) => ({
                          ...field,
                          placeholder: event.target.value,
                        }));
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
                        checked={formField.required ?? false}
                        onChange={(event) => {
                          updateFormField((field) => ({
                            ...field,
                            required: event.target.checked,
                          }));
                        }}
                      />
                      设为必填项
                    </label>
                  </FieldContent>
                </Field>

                {formField.type === "select" ? (
                  <Field>
                    <FieldContent>
                      <FieldLabel htmlFor="field-options">下拉选项</FieldLabel>
                      <Input
                        id="field-options"
                        placeholder="选项（英文逗号分隔）"
                        value={(formField.options ?? []).join(",")}
                        onChange={(event) => {
                          updateFormField((field) => ({
                            ...field,
                            options: event.target.value
                              .split(",")
                              .map((option) => option.trim())
                              .filter(Boolean),
                          }));
                        }}
                      />
                    </FieldContent>
                  </Field>
                ) : null}
              </div>

              <SheetFooter>
                {!isAdding ? (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDeleteInSheet}
                  >
                    <Trash2Icon className="size-4" />
                    删除字段
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleComplete}
                >
                  完成
                </Button>
              </SheetFooter>
            </>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}
