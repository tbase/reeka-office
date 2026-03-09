<script setup lang="ts">
import { computed, onShow, ref, watchEffect } from 'wevu'

import { useFamilyOfficeResourceDetailStore } from '@/stores/cms'

definePageJson({
  navigationBarTitleText: '资源详情',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
  },
})

const resourceId = ref('')

const getResourceId = (): string => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]

  return typeof currentPage?.options?.id === 'string' ? currentPage.options.id : ''
}

onShow(() => {
  const id = getResourceId()

  if (id && id !== resourceId.value) {
    resourceId.value = id
  }
})

const { detail, isLoading } = useFamilyOfficeResourceDetailStore(resourceId)

const resource = computed(() => detail.value ?? {
  id: 0,
  categoryId: 0,
  name: '资源详情',
  content: '',
  fields: {
    banner: undefined,
    category: '',
    contentImage: [],
    contactName: '',
    contactQrcode: undefined,
    contactPhone: '',
  },
  createdAt: new Date(),
  updatedAt: new Date(),
})

const bodyImages = computed(() => resource.value.fields.contentImage)

watchEffect(() => {
  if (resource.value.name) {
    wx.setNavigationBarTitle({
      title: resource.value.name,
    })
  }
})

const previewImages = (current?: string) => {
  const urls = bodyImages.value.length > 0
    ? bodyImages.value
    : []

  if (urls.length === 0) {
    return
  }

  wx.previewImage({
    current: current ?? urls[0],
    urls,
  })
}

const contactManager = () => {
  wx.showToast({
    title: '请联系您的上级经理',
    icon: 'none',
  })
}
</script>

<template>
  <view class="min-h-screen bg-white px-4 pb-28 pt-4 text-slate-900">
    <view class="overflow-hidden shadow-sm">
      <view class="space-y-4">
        <view class="mt-2 flex flex-wrap items-center gap-2">
          <text class="text-xl font-semibold text-slate-900">{{ resource.name }}</text>
          <text
            v-if="resource.fields.category"
            class="inline-flex rounded-full bg-rose-50 px-3 py-1 text-sm text-rose-500"
          >
            {{ resource.fields.category }}
          </text>
        </view>
        <view v-if="bodyImages.length > 0" class="mt-3 space-y-3">
          <image
            v-for="image in bodyImages"
            :key="image"
            class="block h-52 w-full bg-slate-100"
            mode="aspectFill"
            :src="image"
            @tap="previewImages(image)"
          />
        </view>

        <view
          v-else
          class="mt-3 flex h-32 items-center justify-center rounded-[24rpx] bg-slate-50"
        >
          <text class="text-sm text-slate-400">{{ isLoading ? '加载中...' : '暂无介绍' }}</text>
        </view>
      </view>
    </view>
    <view class="fixed bottom-0 left-0 right-0 bg-white px-2 pb-6 pt-3">
      <t-button
        theme="primary"
        size="large"
        block
        shape="rectangle"
        class="w-32 mx-auto"
        @click="contactManager"
      >
        请联系您的上级经理
      </t-button>
    </view>
  </view>
</template>
