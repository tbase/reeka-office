import { ListContentsQuery } from "@reeka-office/domain-cms"
import { PlusIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ConfirmAction } from "@/components/ui/confirm-action"
import { LinkButton } from "@/components/ui/link-button"

import { deleteContentAction } from "./actions"

export async function ContentsCardList({
  categoryId,
}: {
  categoryId: number | null
}) {
  const { contents, total } = await new ListContentsQuery(
    categoryId ? { categoryId } : {}
  ).query()

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">当前分类内容总数：{total}</p>

      {contents.length === 0 ? (
        <div className="text-muted-foreground rounded-md border border-dashed px-3 py-6 text-sm">
          当前分类下暂无内容。
          <LinkButton
            href={categoryId ? `/cms/contents/new?categoryId=${categoryId}` : "/cms/contents/new"}
            size="sm"
            className="ml-2"
          >
            <PlusIcon className="size-3.5" />
            新增内容
          </LinkButton>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {contents.map((item) => (
            <Card key={item.id}>
              <CardHeader className="gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-base leading-none">{item.name}</CardTitle>
                  <p className="text-muted-foreground text-xs">分类：{item.categoryName}</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground line-clamp-3 text-sm">
                  {item.content || "(空正文)"}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">ID #{item.id}</span>
                  <div className="flex gap-2">
                    <LinkButton href={`/cms/contents/${item.id}/edit`} size="sm" variant="outline">编辑</LinkButton>
                    <ConfirmAction
                      action={deleteContentAction}
                      hiddenFields={{ id: item.id }}
                      title={`删除「${item.name}」？`}
                      description="此操作不可撤销，内容将被永久删除。"
                      confirmLabel="确认删除"
                    >
                      <Button size="sm" variant="destructive">删除</Button>
                    </ConfirmAction>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
