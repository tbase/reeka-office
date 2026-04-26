import { createCustomerTypeAction } from "@/actions/crm/customer-type-actions";
import { CustomerTypeFormNew } from "@/components/crm/customer-type-form-new";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

const FORM_ID = "create-crm-customer-type-form";

export default function NewCrmCustomerTypePage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">新增客户类型</h1>
          <p className="text-muted-foreground text-sm">
            配置代理人端可选择的客户类型。
          </p>
        </div>
        <div className="flex items-center gap-2">
          <LinkButton href="/crm/customer-types" variant="outline" size="sm">
            返回
          </LinkButton>
          <Button type="submit" form={FORM_ID} size="sm">
            保存
          </Button>
        </div>
      </div>

      <CustomerTypeFormNew id={FORM_ID} action={createCustomerTypeAction} />
    </div>
  );
}
