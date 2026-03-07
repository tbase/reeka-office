"use client";

import type {
  NewbieTaskCategoryRow,
  NewbieTaskStageRow,
} from "@reeka-office/domain-newbie";
import type { PointItemRow } from "@reeka-office/domain-point";
import { useRouter } from "next/navigation";

import type { NewbieTaskFormValue } from "./newbie-task-form";
import { NewbieTaskForm } from "./newbie-task-form";

export function NewbieTaskFormNew({
  id,
  action,
  stages,
  categories,
  pointItems,
  value,
  onSuccess,
}: {
  id: string;
  action: (
    formData: FormData,
  ) => { success: true } | void | Promise<{ success: true } | void>;
  stages: NewbieTaskStageRow[];
  categories: NewbieTaskCategoryRow[];
  pointItems: PointItemRow[];
  value?: NewbieTaskFormValue;
  onSuccess?: () => void;
}) {
  const router = useRouter();

  function handleSuccess() {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/newbie/tasks");
    }
  }

  return (
    <NewbieTaskForm
      action={action}
      id={id}
      stages={stages}
      categories={categories}
      pointItems={pointItems}
      value={value}
      lockStageSelection={value?.stageId != null}
      showDisplayOrder={false}
      prioritizeStageAndCategory
      onSuccess={handleSuccess}
    />
  );
}
