import { notFound } from "next/navigation";

import { GetCustomerTypeConfigQuery } from "@reeka-office/domain-crm";

import { updateCustomerTypeAction } from "@/actions/crm/customer-type-actions";
import { CustomerTypeFormEdit } from "@/components/crm/customer-type-form-edit";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";

const FORM_ID = "edit-crm-customer-type-form";

export default async function EditCrmCustomerTypePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customerTypeId = Number(id);
  if (!Number.isInteger(customerTypeId) || customerTypeId <= 0) {
    notFound();
  }

  const value = await new GetCustomerTypeConfigQuery({ customerTypeId }).query();
  if (!value) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">编辑客户类型</h1>
          <p className="text-muted-foreground text-sm">
            {value.name}
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

      <CustomerTypeFormEdit id={FORM_ID} action={updateCustomerTypeAction} value={value} />
    </div>
  );
}
