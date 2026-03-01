import {
  ListCategoriesQuery,
  ListContentsQuery,
} from "@reeka-office/domain-cms";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";

import { ContentFormEdit } from "@/components/cms/content-form-edit";
import { updateContentAction } from "../../actions";

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("无效内容 ID");
  }
  return id;
}

export default async function CmsContentEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = parseId(idParam);

  const [categories, contents] = await Promise.all([
    new ListCategoriesQuery().query(),
    new ListContentsQuery().query(),
  ]);

  const content = contents.contents.find((item) => item.id === id) ?? null;

  if (!content) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>内容不存在</CardTitle>
          <CardDescription>该内容可能已被删除。</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/cms/contents">返回内容列表</Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          编辑内容：{content.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          请根据实际信息更新标题、正文与分类。
        </p>
      </div>

      <ContentFormEdit
        id="content-form"
        categories={categories}
        action={updateContentAction}
        value={{
          id: content.id,
          name: content.name,
          content: content.content,
          categoryId: content.categoryId,
          fields: content.fields,
        }}
      />

      <div className="flex gap-2 max-w-xl">
        <Button type="submit" form="content-form">
          保存内容
        </Button>
        <LinkButton href="/cms/contents" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  );
}
