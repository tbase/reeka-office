import { ListContentsQuery } from "@reeka-office/domain-cms";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";

import { deleteContentAction } from "@/actions/cms/content-actions";

export async function ContentsCardList({
  categoryId,
}: {
  categoryId: number | null;
}) {
  await getRequiredAdminContext();
  const { contents, total } = await new ListContentsQuery(
    categoryId ? { categoryId } : {},
  ).query();

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs">当前分类内容总数：{total}</p>

      {contents.length === 0 ? (
        <Empty title="当前分类下暂无内容" />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {contents.map((item) => (
            <Card key={item.id}>
              <CardHeader className="gap-2">
                <div className="flex justify-between gap-2">
                  <CardTitle className="text-sm leading-none">
                    {item.name}
                  </CardTitle>
                  <span className="text-muted-foreground shrink-0 text-xs">
                    @{item.categoryName}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground line-clamp-3 text-sm">
                  {item.content || "(空正文)"}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs">
                    ID #{item.id}
                  </span>
                  <div className="flex gap-2">
                    <LinkButton
                      href={`/cms/contents/${item.id}/edit`}
                      size="sm"
                      variant="outline"
                    >
                      编辑
                    </LinkButton>
                    <ConfirmAction
                      action={deleteContentAction}
                      hiddenFields={{ id: item.id }}
                      title={`删除「${item.name}」？`}
                      description="此操作不可撤销，内容将被永久删除。"
                      confirmLabel="确认删除"
                    >
                      <Button size="sm" variant="destructive">
                        删除
                      </Button>
                    </ConfirmAction>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
