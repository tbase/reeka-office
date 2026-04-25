export const DESIGNATION_NAMES = [
  'LA',
  'FC',
  'UM',
  'SUM',
  'BM',
  'RM',
  'SRM',
  'RD',
  'SRD',
] as const

export type DesignationName = (typeof DESIGNATION_NAMES)[number]

const firstManagementDesignation = 3

export function getDesignationValue(
  designationName: string | null | undefined,
): number | null {
  const normalizedName = designationName?.trim().toUpperCase()
  if (!normalizedName) {
    return null
  }

  const index = DESIGNATION_NAMES.findIndex((name) => name === normalizedName)
  return index >= 0 ? index : null
}

export function getDesignationName(
  designation: number | null | undefined,
): DesignationName | null {
  if (!Number.isInteger(designation)) {
    return null
  }

  return DESIGNATION_NAMES[designation as number] ?? null
}

export function isManagementDesignation(designation: number | null | undefined): boolean {
  return Number.isInteger(designation) && (designation as number) >= firstManagementDesignation
}
