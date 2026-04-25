export type DateTimeInput = Date | string

type DateTimeParts = {
  year: string
  month: string
  day: string
  hours: string
  minutes: string
  seconds: string
}

type FormatDateTimeOptions = {
  dateSeparator?: "-" | "/"
  includeSeconds?: boolean
}

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/
const DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
const EXPLICIT_TIMEZONE_RE = /(?:Z|[+-]\d{2}:\d{2})$/

function pad(value: number | string) {
  return String(value).padStart(2, "0")
}

function getUtcParts(date: Date): DateTimeParts {
  return {
    year: String(date.getUTCFullYear()),
    month: pad(date.getUTCMonth() + 1),
    day: pad(date.getUTCDate()),
    hours: pad(date.getUTCHours()),
    minutes: pad(date.getUTCMinutes()),
    seconds: pad(date.getUTCSeconds()),
  }
}

function parseDateTimeParts(value: DateTimeInput): DateTimeParts {
  if (value instanceof Date) {
    return getUtcParts(value)
  }

  const text = value.trim()
  const dateOnlyMatch = text.match(DATE_ONLY_RE)
  if (dateOnlyMatch) {
    const [, year, month, day] = dateOnlyMatch
    return {
      year,
      month,
      day,
      hours: "00",
      minutes: "00",
      seconds: "00",
    }
  }

  const dateTimeMatch = text.match(DATETIME_RE)
  if (dateTimeMatch && !EXPLICIT_TIMEZONE_RE.test(text)) {
    const [, year, month, day, hours, minutes, seconds = "00"] = dateTimeMatch
    return {
      year,
      month,
      day,
      hours,
      minutes,
      seconds,
    }
  }

  const parsed = new Date(text)
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid datetime value: ${value}`)
  }

  return getUtcParts(parsed)
}

// Business tables use MySQL DATETIME wall-clock values. Keep that wall clock
// when rendering in admin instead of applying the runtime timezone again.
export function formatDateTime(
  value: DateTimeInput,
  options: FormatDateTimeOptions = {},
): string {
  const { dateSeparator = "-", includeSeconds = false } = options
  const parts = parseDateTimeParts(value)
  const date = [parts.year, parts.month, parts.day].join(dateSeparator)
  const time = includeSeconds
    ? `${parts.hours}:${parts.minutes}:${parts.seconds}`
    : `${parts.hours}:${parts.minutes}`

  return `${date} ${time}`
}

export function formatDate(
  value: DateTimeInput,
  { dateSeparator = "-" }: Pick<FormatDateTimeOptions, "dateSeparator"> = {},
): string {
  const parts = parseDateTimeParts(value)
  return [parts.year, parts.month, parts.day].join(dateSeparator)
}
