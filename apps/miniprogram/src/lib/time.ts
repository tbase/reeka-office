export type TimeValue = string | Date | null | undefined

function parseTime(value: TimeValue): Date | null {
  if (!value) {
    return null
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date
}

export function formatDate(value: TimeValue, emptyText = '-'): string {
  const date = parseTime(value)
  if (!date) {
    return emptyText
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function formatTime(value: TimeValue, emptyText = '-'): string {
  const dateText = formatDate(value, '')
  if (!dateText) {
    return emptyText
  }

  const date = parseTime(value)
  if (!date) {
    return emptyText
  }

  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')

  return `${dateText} ${hour}:${minute}`
}
