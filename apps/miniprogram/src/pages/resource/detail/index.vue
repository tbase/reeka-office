<script setup lang="ts">
import { computed, onLoad, ref, watchEffect } from "wevu";

import { useResourceContentStore } from "@/stores/cms";

definePageJson({
  navigationBarTitleText: "资源详情",
  backgroundColor: "#f6f7fb",
  usingComponents: {
    "t-button": "tdesign-miniprogram/button/button",
    "t-empty": "tdesign-miniprogram/empty/empty",
    "t-tag": "tdesign-miniprogram/tag/tag",
  },
});

const resourceId = ref("");
const emptyResource = {
  id: 0,
  name: "资源详情",
  content: "",
  category: "",
  logo: "",
  contentImages: [],
  contactName: "",
  contactPhone: "",
  createdAt: new Date(),
  updatedAt: new Date(),
};

onLoad((options) => {
  resourceId.value = typeof options?.id === "string" ? options.id : "";
});

const { data, isLoading } = useResourceContentStore(resourceId);

const resource = computed(() => {
  return data.value ?? emptyResource;
});

const bodyImages = computed(() => resource.value.contentImages);

watchEffect(() => {
  if (resource.value.name) {
    wx.setNavigationBarTitle({
      title: resource.value.name,
    });
  }
});

const previewImages = (current?: string) => {
  const urls = bodyImages.value.length > 0 ? bodyImages.value : [];

  if (urls.length === 0) {
    return;
  }

  wx.previewImage({
    current: current ?? urls[0],
    urls,
  });
};

const contactManager = () => {
  wx.showToast({
    title: "请联系您的上级经理",
    icon: "none",
  });
};
</script>

<template>
  <view class="min-h-screen bg-white px-4 pb-28 pt-4 text-slate-900">
    <view class="overflow-hidden shadow-sm">
      <view class="space-y-4">
        <view class="mt-2 flex flex-wrap items-center gap-2">
          <view class="text-xl font-semibold text-slate-900">{{
            resource.name
          }}</view>
          <t-tag
            v-if="resource.category"
            theme="primary"
            variant="light"
            shape="round"
          >
            {{ resource.category }}
          </t-tag>
        </view>
        <view v-if="bodyImages.length > 0" class="mt-3 space-y-3">
          <image
            v-for="image in bodyImages"
            :key="image"
            class="block w-full"
            mode="widthFix"
            :src="image"
            @tap="previewImages(image)"
          />
        </view>

        <t-empty
          v-else
          class="mt-3 rounded-[24rpx] bg-slate-50 py-10"
          icon="view-list"
          :description="isLoading ? '加载中...' : '暂无介绍'"
        />
      </view>
    </view>
    <view class="fixed bottom-0 left-0 right-0 bg-white px-2 pb-6 pt-3">
      <t-button
        theme="primary"
        size="large"
        block
        shape="rectangle"
        @click="contactManager"
      >
        请联系您的上级经理
      </t-button>
    </view>
  </view>
</template>
