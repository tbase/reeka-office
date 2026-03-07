import { GetNewbieTaskStageQuery } from "@reeka-office/domain-newbie"
import { notFound } from "next/navigation"

import { NewbieStageFormEdit } from "@/components/newbie/newbie-stage-form-edit"
import { Button } from "@/components/ui/button"
import { LinkButton } from "@/components/ui/link-button"

import { updateNewbieStageAction } from "../../actions"

function parseId(value: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效阶段 ID")
  }
  return id
}

function parseRedirectTo(value: string | undefined): string {
  if (!value || !value.startsWith("/")) {
    return "/newbie/stages"
  }

  return value
}

export default async function NewbieStageEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ redirectTo?: string }>
}) {
  const [{ id: idParam }, { redirectTo: redirectToParam }] = await Promise.all([
    params,
    searchParams,
  ])
  const id = parseId(idParam)
  const redirectTo = parseRedirectTo(redirectToParam)

  const stage = await new GetNewbieTaskStageQuery({ id }).query()
  if (!stage) {
    notFound()
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">编辑任务阶段：{stage.title}</h1>
        <p className="text-muted-foreground text-sm">修改后会影响新手任务在前台的阶段展示。</p>
      </div>

      <NewbieStageFormEdit
        action={updateNewbieStageAction}
        id="newbie-stage-form"
        value={{
          id: stage.id,
          stage: stage.stage,
          title: stage.title,
          description: stage.description,
        }}
      />

      <div className="flex gap-2">
        <Button type="submit" form="newbie-stage-form">
          保存阶段
        </Button>
        <LinkButton href={redirectTo} variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  )
}
