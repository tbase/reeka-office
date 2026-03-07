import { NewbieStageFormNew } from "@/components/newbie/newbie-stage-form-new"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"

import { createNewbieStageAction } from "../actions"

function parseRedirectTo(value: string | undefined): string {
  if (!value || !value.startsWith("/")) {
    return "/newbie/stages"
  }

  return value
}

export default async function NewbieStageCreatePage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const { redirectTo: redirectToParam } = await searchParams
  const redirectTo = parseRedirectTo(redirectToParam)

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增任务阶段</h1>
        <p className="text-muted-foreground text-sm">创建后可在任务管理中按阶段归类使用。</p>
      </div>

      <NewbieStageFormNew
        action={createNewbieStageAction}
        id="newbie-stage-form"
        redirectTo={redirectTo}
      />

      <div className="flex gap-2">
        <Button type="submit" form="newbie-stage-form">
          创建阶段
        </Button>
        <LinkButton href={redirectTo} variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
