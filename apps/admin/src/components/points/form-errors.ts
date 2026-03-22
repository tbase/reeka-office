export function getFieldError(validationErrors: unknown, fieldName: string) {
  if (!validationErrors || typeof validationErrors !== "object") {
    return undefined
  }

  const fieldError = (validationErrors as Record<string, unknown>)[fieldName]
  if (!fieldError || typeof fieldError !== "object" || Array.isArray(fieldError)) {
    return undefined
  }

  const errors = (fieldError as { _errors?: unknown })._errors
  return Array.isArray(errors) && typeof errors[0] === "string"
    ? errors[0]
    : undefined
}

export function getFormError(validationErrors: unknown) {
  if (!validationErrors || typeof validationErrors !== "object") {
    return undefined
  }

  const errors = (validationErrors as { _errors?: unknown })._errors
  return Array.isArray(errors) && typeof errors[0] === "string"
    ? errors[0]
    : undefined
}

export function getErrorMessage(value: unknown) {
  return typeof value === "string" ? value : undefined
}
