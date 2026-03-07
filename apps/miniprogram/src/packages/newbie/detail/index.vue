<script setup lang="ts">
import { computed, onShow, ref } from "wevu";

import { useQuery } from "@/hooks/useQuery";

definePageJson({
  navigationBarTitleText: "任务详情",
  backgroundColor: "#f6f7fb",
  usingComponents: {
    "checkin-form-popup": "./components/checkin-form-popup",
    "t-button": "tdesign-miniprogram/button/button",
  },
});

const taskId = ref<number | null>(null);
const checkinPopupVisible = ref(false);

const { data, loading } = useQuery({
  queryKey: () => {
    if (taskId.value === null) {
      return undefined;
    }

    return ["newbie/getTaskDetail", { id: taskId.value }];
  },
});

const taskDetail = computed(() => data.value);

const formatStageLabel = (stage: string) => {
  const matchedWeek = /^W0*([1-9]\d*)$/i.exec(stage);

  if (matchedWeek) {
    return `第${matchedWeek[1]}周`;
  }

  return stage;
};

const formatPointAmount = (pointAmount: number | null) => {
  if (pointAmount === null) {
    return "完成后可打卡";
  }

  return `完成后预计获得 +${pointAmount} 积分`;
};

const handleCheckin = () => {
  checkinPopupVisible.value = true;
};

const handleCheckinPopupClose = () => {
  checkinPopupVisible.value = false;
};

const handleEvidenceSubmit = () => {
  checkinPopupVisible.value = false;
};

onShow(() => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  const rawTaskId = currentPage?.options?.taskId;
  const parsedTaskId = Number(rawTaskId);

  taskId.value = Number.isFinite(parsedTaskId) ? parsedTaskId : null;
});
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-40 pt-4 text-slate-900">
    <view v-if="loading && !taskDetail" class="space-y-4">
      <view class="h-28 animate-pulse rounded-[28rpx] bg-white" />
      <view class="h-56 animate-pulse rounded-[28rpx] bg-white" />
    </view>

    <view
      v-else-if="!taskDetail"
      class="rounded-[28rpx] bg-white px-5 py-8 text-center shadow-lg shadow-slate-200/60"
    >
      <text class="block text-base font-semibold text-slate-900">
        未找到任务
      </text>
      <text class="mt-2 block text-sm leading-6 text-slate-500">
        当前任务不存在，或页面参数丢失，请返回任务列表后重试。
      </text>
    </view>

    <view v-else class="space-y-4">
      <view
        class="rounded-[28rpx] bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 p-5 text-white shadow-lg shadow-rose-200/70"
      >
        <view class="flex items-center text-xs gap-2">
          <text class="rounded-full px-3 py-1 tracking-[0.25em] bg-white/20">
            {{ formatStageLabel(taskDetail.stage) }}
          </text>
          <text>
            {{ taskDetail.stageTitle }}
          </text>
        </view>
        <text class="mt-4 block text-lg font-semibold leading-9">
          {{ taskDetail.title }}
        </text>
        <text
          class="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs"
        >
          {{ taskDetail.categoryName }}
        </text>
      </view>

      <view
        class="rounded-[28rpx] bg-white px-5 py-5 shadow-sm shadow-slate-200/70"
      >
        <text class="text-xs font-medium tracking-[0.2em] text-slate-400">
          任务描述
        </text>
        <text class="mt-3 block text-sm leading-7 text-slate-700">
          {{
            taskDetail.description ||
            "该任务暂未填写详细描述，请先按照任务标题完成对应动作。"
          }}
        </text>
      </view>
    </view>

    <view
      class="fixed inset-x-0 bottom-0 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+24rpx)] pt-3 shadow-[0_-8rpx_24rpx_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <view class="mx-auto flex items-center justify-between gap-4">
        <view class="min-w-0 flex-1">
          {{ formatPointAmount(taskDetail?.pointAmount ?? null) }}
        </view>

        <t-button theme="primary" block @tap="handleCheckin">
          立即打卡
        </t-button>
      </view>
    </view>

    <checkin-form-popup
      :visible="checkinPopupVisible"
      @close="handleCheckinPopupClose"
      @submit="handleEvidenceSubmit"
    />
  </view>
</template>
