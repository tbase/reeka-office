export const normalizeImageURL = (src: string): string => {
  if (src.includes("://")) {
    return src;
  }
  if (src.startsWith("/")) {
    src = src.slice(1);
  }
  if (!process.env.COS_BUCKET) {
    return src;
  }
  return `https://${process.env.COS_BUCKET}.tcb.qcloud.la/${src}`;
};