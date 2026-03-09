export const normalizeImageURL = (src: string | null | undefined): string | undefined => {
  if (!src) return undefined
  if (src.includes("://") || src.startsWith("cloud://")) return src
  const normalizedPath = src.replace(/^\/+/, "")
  return `https://${process.env.COS_BUCKET}.tcb.qcloud.la/${normalizedPath}`
}