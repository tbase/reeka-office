function pad(value: number) {
  return String(value).padStart(2, "0")
}

function buildFetchHour(now: Date) {
  return [now.getFullYear(), pad(now.getMonth() + 1), pad(now.getDate()), pad(now.getHours())].join("")
}

export { buildFetchHour, pad }
