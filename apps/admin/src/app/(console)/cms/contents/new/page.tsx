import { ListCategoriesQuery } from "@reeka-office/domain-cms";

import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

import { ContentFormNew } from "@/components/cms/content-form-new";
import { createContentAction } from "../actions";

function parseOptionalId(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return undefined;
  }

  return id;
}

export default async function CmsContentCreatePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const categories = await new ListCategoriesQuery().query();
  const defaultCategoryId = parseOptionalId(
    typeof params.categoryId === "string" ? params.categoryId : undefined,
  );
  const resolvedDefaultCategoryId = categories.some(
    (category) => category.id === defaultCategoryId,
  )
    ? defaultCategoryId
    : undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增内容</h1>
        <p className="text-muted-foreground text-sm">
          请选择分类并填写标题、正文与扩展信息。
        </p>
      </div>

      <ContentFormNew
        action={createContentAction}
        id="content-form"
        categories={categories}
        categoryId={resolvedDefaultCategoryId}
      />

      <div className="flex gap-2 max-w-xl">
        <Button
          type="submit"
          form="content-form"
          disabled={categories.length === 0}
        >
          创建内容
        </Button>
        <LinkButton href="/cms/contents" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  );
}
