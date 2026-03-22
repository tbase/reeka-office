export type PlanStatus = "draft" | "published" | "archived"

export function getPlanStatusText(status: PlanStatus) {
  if (status === "draft") {
    return "草稿"
  }

  if (status === "published") {
    return "已发布"
  }

  return "已归档"
}

export function getPlanStatusVariant(status: PlanStatus) {
  if (status === "published") {
    return "default" as const
  }

  if (status === "archived") {
    return "secondary" as const
  }

  return "outline" as const
}
