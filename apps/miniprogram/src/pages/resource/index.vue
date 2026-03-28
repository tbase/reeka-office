<script setup lang="ts">
import { computed, ref, watch } from "wevu";

import { useResourceContentsStore } from "@/stores/cms";

definePageJson({
  navigationBarTitleText: "家族办公室",
  backgroundColor: "#f6f7fb",
  usingComponents: {
    "t-button": "tdesign-miniprogram/button/button",
    "t-empty": "tdesign-miniprogram/empty/empty",
    "t-tabs": "tdesign-miniprogram/tabs/tabs",
    "t-tab-panel": "tdesign-miniprogram/tab-panel/tab-panel",
  },
});

const LOGO_PLACEHOLDER = "/logo.png";
const selectedCategorySlug = ref<string | undefined>(undefined);

const { data, isLoading: resourcesLoading } = useResourceContentsStore();

const contents = computed(() => data.value?.contents ?? []);
const categories = computed(() => data.value?.categories ?? []);
const resources = computed(() => {
  const allResources = contents.value;

  if (!selectedCategorySlug.value) {
    return allResources;
  }

  return allResources.filter(
    (item) => item.category === selectedCategorySlug.value,
  );
});

watch(
  categories,
  (nextCategories) => {
    if (
      selectedCategorySlug.value &&
      nextCategories.includes(selectedCategorySlug.value)
    ) {
      return;
    }

    const nextSlug = nextCategories[0];
    if (!selectedCategorySlug.value && nextSlug) {
      selectedCategorySlug.value = nextSlug;
    }

    if (selectedCategorySlug.value && !nextSlug) {
      selectedCategorySlug.value = undefined;
    }

    if (
      selectedCategorySlug.value &&
      nextSlug &&
      !nextCategories.includes(selectedCategorySlug.value)
    ) {
      selectedCategorySlug.value = nextSlug;
    }
  },
  { immediate: true },
);

const isLoading = computed(() => resourcesLoading.value);

const selectCategory = (slug: string) => {
  if (slug === selectedCategorySlug.value) {
    return;
  }

  selectedCategorySlug.value = slug;
};

const handleCategoryChange = (event: { value: string }) => {
  const nextSlug = event.value;

  if (typeof nextSlug !== "string") {
    return;
  }

  selectCategory(nextSlug);
};

const openDetail = (id: number) => {
  wx.navigateTo({
    url: `/pages/resource/detail/index?id=${id}`,
  });
};
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-10 pt-4">
    <t-tabs
      v-if="categories.length"
      theme="tag"
      :value="selectedCategorySlug"
      :space-evenly="false"
      @change="handleCategoryChange"
    >
      <t-tab-panel
        v-for="category in categories"
        :key="category"
        :value="category"
        :label="category"
      />
    </t-tabs>

    <t-empty
      v-if="categories.length === 0 && !isLoading"
      class="mt-4 rounded-xl bg-card py-8 shadow-md"
      icon="view-list"
      description="暂无家办内容"
    />

    <view v-else-if="resources.length > 0" class="mt-4 grid grid-cols-2 gap-4">
      <view
        v-for="item in resources"
        :key="item.id"
        class="overflow-hidden rounded-md border border-border bg-card shadow-md"
      >
        <image
          class="h-32 w-full bg-muted"
          mode="aspectFill"
          :src="item.logo || LOGO_PLACEHOLDER"
        />
        <view class="p-3">
          <view class="block font-semibold">{{ item.name }}</view>
          <view class="mt-2 flex justify-end">
            <t-button size="small" theme="light" @click="openDetail(item.id)">
              查看
            </t-button>
          </view>
        </view>
      </view>
    </view>

    <t-empty
      v-else-if="!isLoading"
      class="mt-4 rounded-xl bg-card py-8 shadow-md"
      icon="view-list"
      description="当前分类暂无资源"
    />
  </view>
</template>
