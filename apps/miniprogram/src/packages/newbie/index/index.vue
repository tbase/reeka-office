<script setup lang="ts">
import { computed, ref, watchEffect } from "wevu";

import { useQuery } from "@/hooks/useQuery";

definePageJson({
  navigationBarTitleText: "新手任务",
  backgroundColor: "#f6f7fb",
});

const currentStageIndex = ref(0);

const { data, loading } = useQuery({
  queryKey: ["newbie/getHome", undefined],
  refetchOnShow: true,
});

const stages = computed(() => data.value?.stages ?? []);

const currentStage = computed(() => {
  return stages.value[currentStageIndex.value] ?? null;
});

const currentTasks = computed(() => currentStage.value?.tasks ?? []);

watchEffect(() => {
  const lastIndex = stages.value.length - 1;

  if (lastIndex < 0) {
    currentStageIndex.value = 0;
    return;
  }

  if (currentStageIndex.value > lastIndex) {
    currentStageIndex.value = lastIndex;
  }
});

const handleStageChange = (event: { detail: { current: number } }) => {
  currentStageIndex.value = event.detail.current;
};

const formatStageLabel = (stage: string) => {
  const matchedWeek = /^W0*([1-9]\d*)$/i.exec(stage);

  if (matchedWeek) {
    return `第${matchedWeek[1]}周`;
  }

  return stage;
};

const formatPointAmount = (pointAmount: number | null) => {
  if (pointAmount === null) {
    return "";
  }

  return `+${pointAmount} 积分`;
};

const formatTaskAction = (isCheckedIn: boolean) => {
  return isCheckedIn ? "已打卡" : "去打卡";
};

const goTaskDetail = (taskId: number) => {
  wx.navigateTo({
    url: `/packages/newbie/detail/index?taskId=${taskId}`,
  });
};
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-12 pt-4 text-slate-900">
    <view v-if="loading && stages.length === 0" class="space-y-4">
      <view class="h-32 animate-pulse rounded-[28rpx] bg-white" />
      <view class="space-y-3">
        <view class="h-5 w-40 animate-pulse rounded bg-slate-100" />
        <view class="h-24 animate-pulse rounded-[24rpx] bg-slate-50" />
        <view class="h-24 animate-pulse rounded-[24rpx] bg-slate-50" />
      </view>
    </view>

    <view
      v-else-if="stages.length === 0"
      class="rounded-[28rpx] bg-white px-5 py-8 text-center shadow-lg shadow-slate-200/60"
    >
      <text class="block text-base font-semibold text-slate-900">
        暂无新手任务
      </text>
      <text class="mt-2 block text-sm leading-6 text-slate-500">
        当前还没有可展示的阶段与任务，请稍后再查看。
      </text>
    </view>

    <view v-else class="mt-4">
      <swiper
        class="h-32"
        :current="currentStageIndex"
        previous-margin="12px"
        next-margin="36px"
        @change="handleStageChange"
      >
        <swiper-item v-for="stage in stages" :key="stage.id">
          <view
            class="mr-3 h-full rounded-[28rpx] bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 p-4 text-white shadow-lg shadow-rose-200/70"
          >
            <text
              class="rounded-full bg-white/20 px-3 py-1 text-xs tracking-[0.3em]"
            >
              {{ formatStageLabel(stage.stage) }}
            </text>
            <text class="mt-3 block text-xl font-semibold">
              {{ stage.title }}
            </text>
          </view>
        </swiper-item>
      </swiper>

      <view class="mt-4">
        <view class="flex items-end justify-between">
          <text class="block text-lg font-semibold text-slate-900">
            {{ currentStage?.title }}
          </text>
          <text class="text-xs text-slate-400">
            {{ currentStageIndex + 1 }}/{{ stages.length }}
          </text>
        </view>

        <view
          v-if="currentTasks.length === 0"
          class="mt-4 rounded-[24rpx] border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center"
        >
          <text class="block text-sm font-medium text-slate-700">
            当前阶段暂无任务
          </text>
          <text class="mt-2 block text-xs leading-5 text-slate-500">
            该阶段还未配置任务项，后续补充后会在这里展示。
          </text>
        </view>

        <view v-else class="mt-4 space-y-3">
          <view
            v-for="task in currentTasks"
            :key="task.id"
            class="rounded-[24rpx] bg-white px-4 py-4 shadow-sm shadow-slate-200/70"
            @tap="goTaskDetail(task.id)"
          >
            <view class="flex items-start justify-between gap-3">
              <view class="min-w-0 flex-1">
                <text class="block text-xs font-medium text-rose-500">
                  {{ task.categoryName }}
                </text>
                <text class="block text-base font-semibold text-slate-900">
                  {{ task.title }}
                </text>
              </view>

              <view class="flex shrink-0 items-center gap-2">
                <text
                  v-if="task.pointAmount !== null"
                  class="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600"
                >
                  {{ formatPointAmount(task.pointAmount) }}
                </text>
                <text
                  class="rounded-full px-3 py-1 text-xs font-medium"
                  :class="
                    task.isCheckedIn
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-rose-50 text-rose-500'
                  "
                >
                  {{ formatTaskAction(task.isCheckedIn) }}
                </text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
