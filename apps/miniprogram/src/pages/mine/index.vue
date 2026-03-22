<script setup lang="ts">
import { computed, onShow, ref } from "wevu";

import { useMutation } from "@/hooks/useMutation";
import { refreshTenantCatalog } from "@/lib/center-api";
import { getActiveTenant } from "@/lib/tenant-session";
import { usePointSummaryStore } from "@/stores/points";
import { useUserStore } from "@/stores/user";

definePageJson({
  navigationBarTitleText: "我的",
  backgroundColor: "#f6f7fb",
});

const { user, refetch: refetchUser } = useUserStore();
const { summary } = usePointSummaryStore();
const requestingAvatar = ref(false);
const tenantName = ref(getActiveTenant()?.tenantName ?? "");

const { mutate: updateAvatar, loading: avatarUpdating } = useMutation(
  "identity/updateAvatar",
  {
    showLoading: "更新头像中...",
  },
);

const member = computed(() => {
  return {
    agentName: user.value?.agentName ?? "",
    agentCode: user.value?.agentCode ?? "",
    avatar: user.value?.avatar ?? null,
    currentPoints: summary.value?.currentPoints ?? "",
  };
});

const syncAvatar = async (avatar: string) => {
  const result = await updateAvatar({ avatar });
  if (!result) {
    wx.showToast({
      title: "头像更新失败",
      icon: "none",
    });
    return;
  }

  await refetchUser();
};

const onChooseAvatar = async (
  event: WechatMiniprogram.CustomEvent<{ avatarUrl?: string }>,
) => {
  if (requestingAvatar.value || avatarUpdating.value) {
    return;
  }

  const avatarUrl = event.detail?.avatarUrl;
  if (!avatarUrl) {
    wx.showToast({
      title: "未获取到头像",
      icon: "none",
    });
    return;
  }

  requestingAvatar.value = true;
  try {
    await syncAvatar(avatarUrl);
  } catch {
    wx.showToast({
      title: "头像更新失败",
      icon: "none",
    });
  } finally {
    requestingAvatar.value = false;
  }
};

onShow(() => {
  void refetchUser();
  void refreshTenantCatalog()
    .then(({ activeTenant }) => {
      tenantName.value = activeTenant?.tenantName ?? ""
    })
    .catch(() => {
      tenantName.value = getActiveTenant()?.tenantName ?? ""
    })
});

const goMyPoints = () => {
  wx.navigateTo({
    url: "/pages/mine/points/index",
  });
};

const goTenantSwitch = () => {
  wx.navigateTo({
    url: "/pages/unauthorized/index",
  });
};
</script>

<template>
  <view class="min-h-screen bg-white text-slate-900">
    <view class="px-4 py-10">
      <view class="flex items-start gap-3">
        <view
          class="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
        >
          <image
            v-if="member.avatar"
            class="h-14 w-14 rounded-full bg-slate-100"
            mode="aspectFill"
            :src="member.avatar"
          />
          <button
            v-else
            class="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-slate-100 px-[10rpx] py-[8rpx] text-center text-slate-600 text-xs leading-[1.2]"
            hover-class="none"
            open-type="chooseAvatar"
            @chooseavatar="onChooseAvatar"
          >
            <text>选择</text>
            <text>头像</text>
          </button>
        </view>

        <view class="flex h-14 min-w-0 flex-1 flex-col justify-between">
          <text
            class="block text-xl font-semibold tracking-wide text-slate-900"
          >
            {{ member.agentName }}
          </text>
          <text v-if="member.agentCode" class="block text-base text-slate-600">
            CODE: {{ member.agentCode }}
          </text>
        </view>
      </view>
    </view>

    <view class="px-4 py-4">
      <view
        class="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
        @tap="goTenantSwitch"
      >
        <view>
          <text class="block text-xs text-slate-500">当前租户</text>
          <text class="mt-1 block text-base font-semibold text-slate-900">
            {{ tenantName || "未选择" }}
          </text>
        </view>
        <view class="flex items-center justify-center">
          <text class="text-base text-slate-500">切换</text>
        </view>
      </view>

      <view
        class="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3"
        @tap="goMyPoints"
      >
        <view>
          <text class="block text-xs text-rose-400"> 积分管理 </text>
          <text class="mt-1 block text-lg font-semibold text-rose-600">
            我的积分{{ member.currentPoints }}
          </text>
        </view>
        <view class="flex items-center justify-center">
          <text class="text-base text-rose-500">查看</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.avatar-picker::after {
  border: none;
}
</style>
