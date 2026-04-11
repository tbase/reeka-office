<script setup lang="ts">
import { computed, onLoad, ref } from 'wevu'

import { useNavTitle } from '@/hooks/useNavTitle'
import { useResourceContentStore } from '@/stores/cms'

definePageJson({
  navigationBarTitleText: '资源详情',
  backgroundColor: '#ffffff',
})

const resourceId = ref('')
const emptyResource = {
  id: 0,
  name: '资源详情',
  content: '',
  category: '',
  logo: '',
  contentImages: [],
  contactName: '',
  contactPhone: '',
  createdAt: new Date(),
  updatedAt: new Date(),
}

onLoad((options) => {
  resourceId.value = typeof options?.id === 'string' ? options.id : ''
})

const { data, isLoading } = useResourceContentStore(resourceId)

const resource = computed(() => {
  return data.value ?? emptyResource
})

const bodyImages = computed(() => resource.value.contentImages)
useNavTitle(() => resource.value.name)

function previewImages(current?: string) {
  const urls = bodyImages.value.length > 0 ? bodyImages.value : []

  if (urls.length === 0) {
    return
  }

  wx.previewImage({
    current: current ?? urls[0],
    urls,
  })
}

function contactManager() {
  wx.showToast({
    title: '请联系您的上级经理',
    icon: 'none',
  })
}
</script>

<template>
  <view class="h-screen flex flex-col bg-card">
    <scroll-view scroll-y class="min-h-0 flex-1 py-4">
      <view class="px-4">
        <view class="flex flex-wrap items-center gap-2">
          <view class="text-xl font-semibold">
            {{ resource.name }}
          </view>
          <t-tag
            v-if="resource.category"
            theme="primary"
            variant="light"
            shape="round"
          >
            {{ resource.category }}
          </t-tag>
        </view>

        <view v-if="bodyImages.length > 0" class="mt-4 space-y-3">
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
          class="mt-4 rounded-xl bg-muted py-10"
          icon="view-list"
          :description="isLoading ? '加载中...' : '暂无介绍'"
        />
      </view>
    </scroll-view>

    <view class="shrink-0 bg-card px-4 pb-safe-1">
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
