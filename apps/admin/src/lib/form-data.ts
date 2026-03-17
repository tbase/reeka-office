type FormDataValueMap<Key extends string> = Record<Key, FormDataEntryValue | null>

export function getFormDataValues<const Keys extends readonly string[]>(
  formData: FormData,
  keys: Keys,
): FormDataValueMap<Keys[number]> {
  return Object.fromEntries(keys.map((key) => [key, formData.get(key)])) as FormDataValueMap<
    Keys[number]
  >
}

export function parseRequiredText(value: FormDataEntryValue | null, label: string): string {
  const text = String(value ?? "").trim()
  if (!text) {
    throw new Error(`${label}不能为空`)
  }
  return text
}

export function parseOptionalText(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim()
  return text || null
}

export function parseRequiredId(
  value: FormDataEntryValue | number | null | undefined,
  errorMessage: string,
): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(errorMessage)
  }
  return id
}

export function parseOptionalId(
  value: FormDataEntryValue | null,
  errorMessage: string,
): number | undefined {
  const raw = String(value ?? "").trim()
  if (!raw) {
    return undefined
  }

  return parseRequiredId(raw, errorMessage)
}

export function parseNonNegativeInt(value: FormDataEntryValue | null, label: string): number {
  const raw = String(value ?? "").trim()
  const num = Number(raw)
  if (!Number.isInteger(num) || num < 0) {
    throw new Error(`${label}必须为非负整数`)
  }
  return num
}

export function parsePositiveInt(value: FormDataEntryValue | null, label: string): number {
  const raw = String(value ?? "").trim()
  const num = Number(raw)
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`${label}必须为正整数`)
  }
  return num
}

export function parseOptionalPositiveInt(value: FormDataEntryValue | null, label: string): number | null {
  const raw = String(value ?? "").trim()
  if (!raw) {
    return null
  }

  return parsePositiveInt(raw, label)
}

export function parseJsonObject(value: FormDataEntryValue | null): Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) {
    return {}
  }

  const parsed: unknown = JSON.parse(value)
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {}
  }

  return parsed as Record<string, unknown>
}
