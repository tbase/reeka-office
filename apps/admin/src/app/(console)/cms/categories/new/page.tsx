import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

import { CategoryFormNew } from "@/components/cms/category-form-new";

import { createCategoryAction } from "../actions";

export default function CmsCategoryCreatePage() {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">新增分类</h1>
        <p className="text-muted-foreground text-sm">
          创建分类并设置需要录入的信息项。
        </p>
      </div>

      <CategoryFormNew action={createCategoryAction} id="category-form" />

      <div className="flex gap-2 max-w-xl justify-end">
        <Button type="submit" form="category-form">
          创建分类
        </Button>
        <LinkButton href="/cms/categories" variant="ghost">
          取消
        </LinkButton>
      </div>
    </div>
  );
}
