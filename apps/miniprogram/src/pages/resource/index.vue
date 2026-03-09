<script setup lang="ts">
import { computed, ref, watch } from 'wevu'

import { useFamilyOfficeResourcesStore } from '@/stores/cms'

definePageJson({
  navigationBarTitleText: '家族办公室',
  backgroundColor: '#f6f7fb',
})

const selectedCategorySlug = ref<string | undefined>(undefined)

const { data, isLoading: resourcesLoading } = useFamilyOfficeResourcesStore()

const contents = computed(() => data.value?.contents ?? [])
const bannerList = computed(() =>
  contents.value.filter((item) => typeof item.fields.banner === 'string' && item.fields.banner.length > 0),
)
const categories = computed(() => data.value?.categories ?? [])
const resources = computed(() => {
  const allResources = contents.value

  if (!selectedCategorySlug.value) {
    return allResources
  }

  return allResources.filter((item) => item.fields.category === selectedCategorySlug.value)
})

watch(
  () => data.value?.currentCategorySlug,
  (nextSlug) => {
    if (!selectedCategorySlug.value && nextSlug) {
      selectedCategorySlug.value = nextSlug
    }
  },
  { immediate: true },
)

const isLoading = computed(() => resourcesLoading.value)

const selectCategory = (slug: string) => {
  if (slug === selectedCategorySlug.value) {
    return
  }

  selectedCategorySlug.value = slug
}

const openDetail = (id: number) => {
  wx.navigateTo({
    url: `/pages/resource/detail/index?id=${id}`,
  })
}

const previewBanner = (current: string) => {
  const urls = bannerList.value
    .map((item) => item.fields.banner)
    .filter((item): item is string => Boolean(item))

  if (urls.length === 0) {
    return
  }

  wx.previewImage({
    current,
    urls,
  })
}
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-10 pt-4 text-slate-900">
    <swiper
      v-if="bannerList.length > 0"
      class="h-44 overflow-hidden rounded-[24rpx]"
      indicator-dots
      autoplay
      circular
      indicator-color="rgba(255,255,255,0.45)"
      indicator-active-color="#ffffff"
    >
      <swiper-item
        v-for="banner in bannerList"
        :key="banner.id"
      >
        <image
          class="h-full w-full rounded-[24rpx] bg-slate-200"
          mode="aspectFill"
          :src="banner.fields.banner"
          @tap="banner.fields.banner && previewBanner(banner.fields.banner)"
        />
      </swiper-item>
    </swiper>

    <scroll-view
      v-if="categories.length"
      scroll-x
      enhanced
      show-scrollbar="false"
      class="mt-4 whitespace-nowrap"
    >
      <view class="inline-flex gap-3">
        <view
          v-for="category in categories"
          :key="category.id"
          class="rounded-full px-4 py-2 text-sm"
          :class="selectedCategorySlug === category.slug
            ? 'bg-rose-500 text-white'
            : 'bg-white text-slate-500'"
          @tap="selectCategory(category.slug)"
        >
          <text>{{ category.name }}</text>
          <text class="ml-1 text-xs opacity-70">{{ category.resourceCount }}</text>
        </view>
      </view>
    </scroll-view>

    <view
      v-if="categories.length === 0 && !isLoading"
      class="mt-4 rounded-[24rpx] bg-white px-4 py-8 text-center shadow-sm"
    >
      <text class="text-sm text-slate-400">暂无家办内容</text>
    </view>

    <view v-else class="mt-4 grid grid-cols-2 gap-4">
      <view
        v-for="item in resources"
        :key="item.id"
        class="overflow-hidden rounded-[24rpx] bg-white shadow-sm"
      >
        <image
          v-if="item.fields.banner"
          class="h-32 w-full bg-slate-200"
          mode="aspectFill"
          :src="item.fields.banner"
        />
        <view class="p-3">
          <text class="block text-base font-semibold text-slate-900">{{ item.name }}</text>
          <view class="mt-1 flex justify-end">
            <view
              class="rounded-full bg-rose-50 px-4 py-2"
              @tap="openDetail(item.id)"
            >
              <text class="text-sm font-medium text-rose-500">查看</text>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
