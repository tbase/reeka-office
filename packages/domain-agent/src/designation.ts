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

export function getDesignationName(
  designation: number | null | undefined,
): DesignationName | null {
  if (!Number.isInteger(designation)) {
    return null
  }

  return DESIGNATION_NAMES[designation as number] ?? null
}
