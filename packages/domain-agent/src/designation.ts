export const DESIGNATION_NAME = [
  'LA',
  'FC',
  'UM',
  'SUM',
  'BM',
  'RM',
  'SRM',
  'RD',
  'SRD',
  'BSM',
  'SBSM',
] as const

export type DesignationName = (typeof DESIGNATION_NAME)[number]

export function getDesignationName(
  designation: number | null | undefined,
): DesignationName | null {
  if (!Number.isInteger(designation)) {
    return null
  }

  const index = designation as number

  return DESIGNATION_NAME[index] ?? null
}
