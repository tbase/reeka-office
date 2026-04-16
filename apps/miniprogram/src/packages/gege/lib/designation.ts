const ORG_TREE_DESIGNATION_NAMES = new Set([
  'SUM',
  'BM',
  'RM',
  'SRM',
  'RD',
  'SRD',
])

export function showOrg(designationName: string | null | undefined) {
  const normalizedName = designationName?.trim().toUpperCase()

  return normalizedName ? ORG_TREE_DESIGNATION_NAMES.has(normalizedName) : false
}
