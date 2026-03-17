import { PlusIcon } from "lucide-react";
import { Suspense } from "react";

import { Empty } from "@/components/ui/empty";
import { LinkButton } from "@/components/ui/link-button";
import { getRequiredAdminContext } from "@/lib/admin-context";
import { ListCategoriesQuery } from "@reeka-office/domain-cms";

import { CategoryTabs } from "./category-tabs";
import { ContentsCardList } from "./contents-card-list";

export const dynamic = "force-dynamic";

function parseOptionalId(value: string | undefined): number | null {
  if (!value) {
    return null;
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export default async function CmsContentsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const categoryFilterId = parseOptionalId(
    typeof params.categoryId === "string" ? params.categoryId : undefined,
  );
  await getRequiredAdminContext();

  const categories = await new ListCategoriesQuery().query();

  const categoryTabs = categories.map((category) => ({
    id: category.id,
    name: category.name,
  }));

  const addHref = categoryFilterId
    ? `/cms/contents/new?categoryId=${categoryFilterId}`
    : "/cms/contents/new";

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">内容列表</h1>
            <p className="text-muted-foreground text-sm">
              按分类查看内容，可新建内容或进入详情编辑。
            </p>
          </div>
          <LinkButton href={addHref} size="sm">
            <PlusIcon className="size-4" />
            新增内容
          </LinkButton>
        </div>

        <CategoryTabs categories={categoryTabs} />
      </div>

      <Suspense
        key={categoryFilterId ?? "all"}
        fallback={<Empty title="正在加载内容..." />}
      >
        <ContentsCardList categoryId={categoryFilterId} />
      </Suspense>
    </div>
  );
}
