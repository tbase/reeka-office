export type CsvColumn<T> = {
  key: keyof T
  header: string
  format?: (value: T[keyof T], row: T) => string | number
}

function escapeCsvCell(value: string | number | null | undefined) {
  const text = String(value ?? "")

  if (text.includes('"') || text.includes(",") || text.includes("\n")) {
    return `"${text.replaceAll('"', '""')}"`
  }

  return text
}

export function toCsv<T extends Record<string, unknown>>(rows: T[], columns?: CsvColumn<T>[]) {
  const resolvedColumns =
    columns ??
    (Object.keys(rows[0] ?? {}).map((key) => ({
      key: key as keyof T,
      header: key,
    })) as CsvColumn<T>[])

  if (resolvedColumns.length === 0) {
    return ""
  }

  const header = resolvedColumns.map((column) => escapeCsvCell(column.header)).join(",")
  const body = rows.map((row) =>
    resolvedColumns
      .map((column) => {
        const value = column.format ? column.format(row[column.key], row) : row[column.key]
        return escapeCsvCell(value as string | number | null | undefined)
      })
      .join(","),
  )

  return [header, ...body].join("\n")
}

function parseCsvRows(content: string) {
  const rows: string[][] = []
  let currentRow: string[] = []
  let currentCell = ""
  let insideQuotes = false
  const normalized = content.replace(/^\uFEFF/, "")

  for (let index = 0; index < normalized.length; index += 1) {
    const character = normalized[index]
    const nextCharacter = normalized[index + 1]

    if (insideQuotes) {
      if (character === '"' && nextCharacter === '"') {
        currentCell += '"'
        index += 1
        continue
      }

      if (character === '"') {
        insideQuotes = false
        continue
      }

      currentCell += character
      continue
    }

    if (character === '"') {
      insideQuotes = true
      continue
    }

    if (character === ",") {
      currentRow.push(currentCell)
      currentCell = ""
      continue
    }

    if (character === "\n") {
      currentRow.push(currentCell.replace(/\r$/, ""))
      rows.push(currentRow)
      currentRow = []
      currentCell = ""
      continue
    }

    currentCell += character
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.replace(/\r$/, ""))
    rows.push(currentRow)
  }

  return rows.filter((row) => row.length > 0 && row.some((cell) => cell.length > 0))
}

export function parseCsv(content: string) {
  const [headerRow, ...bodyRows] = parseCsvRows(content)

  if (!headerRow || headerRow.length === 0) {
    return []
  }

  return bodyRows.map((row) =>
    headerRow.reduce<Record<string, string>>((record, header, index) => {
      record[header] = row[index] ?? ""
      return record
    }, {}),
  )
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")

  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
