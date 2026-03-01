"use client";

import { Field, FieldContent, FieldLabel } from "@/components/ui/field";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { SimpleSelect } from "@/components/ui/simple-select";
import { Textarea } from "@/components/ui/textarea";

export type FieldType =
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

export type CategoryOption = {
  id: number;
  name: string;
  fieldSchema: FieldSchemaItem[];
};

function toBoolean(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value === "true";
  if (typeof value === "number") return value === 1;
  return false;
}

function initialValueForField(field: FieldSchemaItem): unknown {
  if (field.type === "switch") return false;
  return "";
}

export function normalizeFieldValue(
  field: FieldSchemaItem,
  value: unknown,
): unknown {
  if (value === undefined || value === null) {
    return initialValueForField(field);
  }

  if (field.type === "switch") {
    return toBoolean(value);
  }

  if (field.type === "number") {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : "";
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "";
      const parsed = Number(trimmed);
      return Number.isFinite(parsed) ? parsed : "";
    }
    return "";
  }

  if (typeof value === "string") {
    if (field.type === "date") return value.slice(0, 10);
    return value;
  }

  return String(value);
}

export function buildFieldsState(
  schema: FieldSchemaItem[],
  source?: Record<string, unknown>,
): Record<string, unknown> {
  const sourceRecord = source ?? {};
  const next: Record<string, unknown> = { ...sourceRecord };
  for (const field of schema) {
    next[field.name] = normalizeFieldValue(field, sourceRecord[field.name]);
  }
  return next;
}

export function ContentFields({
  category,
  fields,
  onUpdateField,
}: {
  category: CategoryOption | null;
  fields: Record<string, unknown>;
  onUpdateField: (fieldName: string, value: unknown) => void;
}) {
  if (!category) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm">
        请先创建分类。
      </div>
    );
  }

  if (category.fieldSchema.length === 0) {
    return (
      <div className="text-muted-foreground rounded-md border border-dashed px-3 py-4 text-sm">
        该分类暂无扩展字段。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {category.fieldSchema.map((field) => {
        const value = normalizeFieldValue(field, fields[field.name]);
        const fieldId = `field-${field.name}`;

        return (
          <Field key={field.name}>
            <FieldContent>
              <FieldLabel htmlFor={fieldId} aria-required={field.required}>
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </FieldLabel>

              {field.type === "textarea" ? (
                <Textarea
                  id={fieldId}
                  value={String(value)}
                  onChange={(event) =>
                    onUpdateField(field.name, event.target.value)
                  }
                  placeholder={field.placeholder || `请输入${field.label}`}
                  rows={4}
                />
              ) : null}

              {field.type === "switch" ? (
                <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
                  <input
                    id={fieldId}
                    type="checkbox"
                    checked={Boolean(value)}
                    onChange={(event) =>
                      onUpdateField(field.name, event.target.checked)
                    }
                  />
                  开启
                </label>
              ) : null}

              {field.type === "select" ? (
                <SimpleSelect
                  placeholder="请选择"
                  value={String(value)}
                  onValueChange={(nextValue) =>
                    onUpdateField(field.name, nextValue)
                  }
                  items={(field.options ?? []).map((option) => ({
                    value: option,
                    label: option,
                  }))}
                />
              ) : null}

              {field.type === "image" ? (
                <ImageUpload
                  id={fieldId}
                  value={typeof value === "string" ? value : ""}
                  alt={field.label}
                  onChangeAction={(nextValue) =>
                    onUpdateField(field.name, nextValue)
                  }
                />
              ) : null}

              {field.type !== "textarea" &&
              field.type !== "switch" &&
              field.type !== "select" &&
              field.type !== "image" ? (
                <Input
                  id={fieldId}
                  type={
                    field.type === "number" || field.type === "date"
                      ? field.type
                      : "text"
                  }
                  value={String(value)}
                  onChange={(event) => {
                    if (field.type === "number") {
                      const next = event.target.value;
                      if (!next.trim()) {
                        onUpdateField(field.name, "");
                        return;
                      }
                      const parsed = Number(next);
                      onUpdateField(
                        field.name,
                        Number.isFinite(parsed) ? parsed : "",
                      );
                      return;
                    }
                    onUpdateField(field.name, event.target.value);
                  }}
                  placeholder={field.placeholder || `请输入${field.label}`}
                />
              ) : null}
            </FieldContent>
          </Field>
        );
      })}
    </div>
  );
}
