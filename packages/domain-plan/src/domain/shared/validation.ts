export function normalizeRequiredText(value: string, label: string): string {
  const text = value.trim()
  if (!text) {
    throw new Error(`${label}不能为空`)
  }

  return text
}

export function normalizeOptionalText(value?: string | null): string | null {
  const text = value?.trim()
  return text ? text : null
}

export function ensureNonNegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label}必须是非负整数`)
  }

  return value
}

export function ensureSameIds(actualIds: number[], orderedIds: number[], label: string) {
  if (actualIds.length !== orderedIds.length) {
    throw new Error(`${label}排序数据不完整，请刷新后重试`)
  }

  const actualSet = new Set(actualIds)
  const orderedSet = new Set(orderedIds)
  if (orderedSet.size !== orderedIds.length) {
    throw new Error(`${label}排序包含重复项，请刷新后重试`)
  }

  for (const orderedId of orderedIds) {
    if (!actualSet.has(orderedId)) {
      throw new Error(`${label}排序包含无效项，请刷新后重试`)
    }
  }
}
