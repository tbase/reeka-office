export function getFilename(path: string) {
  return path.split("/").at(-1) ?? ""
}
