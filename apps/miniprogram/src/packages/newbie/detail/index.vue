<script setup lang="ts">
import { computed, onShow, ref } from "wevu";

import { useMutation } from "@/hooks/useMutation";
import { invalidateQueries } from "@/hooks/useQuery";
import { useQuery } from "@/hooks/useQuery";
import { useUserStore } from "@/stores/user";

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
const { user } = useUserStore();

const { data, loading, refetch } = useQuery({
  queryKey: () => {
    if (taskId.value === null) {
      return undefined;
    }

    return ["newbie/getTaskDetail", { id: taskId.value }];
  },
  refetchOnShow: true,
});

const taskDetail = computed(() => data.value);
const storagePathPrefix = computed(() => {
  return user.value?.agentCode ?? user.value?.openid ?? "";
});

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

const formatCheckedInAt = (value: string | null) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (num: number) => String(num).padStart(2, "0");

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const handleCheckin = () => {
  if (taskDetail.value?.isCheckedIn) {
    return;
  }

  checkinPopupVisible.value = true;
};

const handleCheckinPopupClose = () => {
  checkinPopupVisible.value = false;
};

const previewEvidence = (current: string) => {
  const urls = taskDetail.value?.evidenceFileIds ?? [];
  if (!urls.length) {
    return;
  }

  wx.previewImage({
    current,
    urls,
  });
};

const { mutate: submitCheckin, loading: submittingCheckin } = useMutation("newbie/submitCheckin", {
  showLoading: "提交打卡中...",
  onSuccess: async () => {
    wx.showToast({
      title: "打卡成功",
      icon: "success",
    });

    checkinPopupVisible.value = false;
    invalidateQueries("newbie/getHome");
    invalidateQueries("newbie/getTaskDetail");
    await refetch();
  },
  onError: (error) => {
    wx.showToast({
      title: error.message || "打卡失败",
      icon: "none",
    });
  },
});

const normalizeEvidenceFileIds = (payload: unknown): string[] => {
  if (Array.isArray(payload)) {
    return payload.filter(
      (item): item is string => typeof item === "string" && item.length > 0,
    );
  }

  if (
    typeof payload === "object"
    && payload !== null
    && "detail" in payload
  ) {
    return normalizeEvidenceFileIds((payload as { detail: unknown }).detail);
  }

  return [];
};

const handleEvidenceSubmit = async (payload: unknown) => {
  if (taskId.value === null || submittingCheckin.value) {
    return;
  }

  const evidenceFileIds = normalizeEvidenceFileIds(payload);

  await submitCheckin({
    taskId: taskId.value,
    evidenceFileIds,
  });
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

      <view
        v-if="taskDetail.isCheckedIn"
        class="rounded-[28rpx] bg-white px-5 py-5 shadow-sm shadow-slate-200/70"
      >
        <text class="text-xs font-medium tracking-[0.2em] text-slate-400">
          打卡记录
        </text>
        <text class="mt-3 block text-sm text-emerald-600">
          已完成打卡
        </text>
        <text
          v-if="taskDetail.checkedInAt"
          class="mt-2 block text-sm leading-6 text-slate-500"
        >
          完成时间：{{ formatCheckedInAt(taskDetail.checkedInAt) }}
        </text>

        <view
          v-if="taskDetail.evidenceFileIds.length > 0"
          class="mt-4 grid grid-cols-3 gap-3"
        >
          <image
            v-for="fileId in taskDetail.evidenceFileIds"
            :key="fileId"
            class="h-24 w-full rounded-[20rpx] bg-slate-100"
            mode="aspectFill"
            :src="fileId"
            @tap="previewEvidence(fileId)"
          />
        </view>
      </view>
    </view>

    <view
      class="fixed inset-x-0 bottom-0 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+24rpx)] pt-3 shadow-[0_-8rpx_24rpx_rgba(15,23,42,0.08)] backdrop-blur"
    >
      <view class="mx-auto flex items-center justify-between gap-4">
        <view class="min-w-0 flex-1">
          {{ formatPointAmount(taskDetail?.pointAmount ?? null) }}
        </view>

        <t-button
          theme="primary"
          block
          :disabled="!taskDetail || taskDetail.isCheckedIn || submittingCheckin"
          @tap="handleCheckin"
        >
          {{ taskDetail?.isCheckedIn ? "已打卡" : "立即打卡" }}
        </t-button>
      </view>
    </view>

    <checkin-form-popup
      :visible="checkinPopupVisible"
      :task-id="taskId"
      :storage-path-prefix="storagePathPrefix"
      @close="handleCheckinPopupClose"
      @submit="handleEvidenceSubmit"
    />
  </view>
</template>
