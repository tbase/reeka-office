<script setup lang="ts">
import { computed, onShow, ref } from "wevu";

import AvatarPicker from "@/components/avatar-picker/index.vue";
import { useMutation } from "@/hooks/useMutation";
import { uploadFile } from "@/lib/upload-file";
import { usePointSummaryStore } from "@/stores/points";
import { useUserStore } from "@/stores/user";

definePageJson({
  navigationBarTitleText: "我的",
  backgroundColor: "#ffffff",
});

const { user, refetch: refetchUser } = useUserStore();
const { summary } = usePointSummaryStore();
const requestingAvatar = ref(false);

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
  const cloudPath = await uploadFile(avatar, `agent/${member.value.agentCode}`);
  const result = await updateAvatar({ avatar: cloudPath });
  if (!result) {
    wx.showToast({
      title: "头像更新失败",
      icon: "none",
    });
    return;
  }

  await refetchUser();
};

const onChooseAvatar = async (event: { avatarUrl?: string }) => {
  if (requestingAvatar.value || avatarUpdating.value) {
    return;
  }

  const avatarUrl = event.avatarUrl;
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
});

const goMyPoints = () => {
  wx.navigateTo({
    url: "/pages/mine/points/index",
  });
};
</script>

<template>
  <view class="min-h-screen">
    <view class="px-4 py-6 bg-white mb-4">
      <view class="flex items-start gap-3">
        <AvatarPicker
          class="shrink-0"
          :src="member.avatar"
          :loading="requestingAvatar || avatarUpdating"
          @choose="onChooseAvatar"
        />

        <view class="flex min-h-[96rpx] min-w-0 flex-1 flex-col justify-center">
          <view class="block font-semibold tracking-wide">
            {{ member.agentName }}
          </view>
          <view v-if="member.agentCode" class="block text-sm">
            {{ member.agentCode }}
          </view>
        </view>
      </view>
    </view>

    <view class="pb-4">
      <t-cell-group bordered class="bg-white">
        <t-cell
          title="积分管理"
          :note="`我的积分 ${member.currentPoints}`"
          arrow
          @click="goMyPoints"
        />
      </t-cell-group>
    </view>
  </view>
</template>
