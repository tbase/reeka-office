<script setup lang="ts">
import { computed } from 'wevu'

import { useUserStore } from '@/stores/user'

definePageJson({
  navigationBarTitleText: '我的',
  backgroundColor: '#f6f7fb',
})

const { user } = useUserStore()

const member = computed(() => {
  const code = user.value?.agentCode?.trim().toUpperCase() ?? ''
  return {
    name: user.value?.agentName ?? code,
    code,
    avatar: user.value?.avatar ?? null,
  }
})

const goMyPoints = () => {
  wx.navigateTo({
    url: '/pages/mine/points/index',
  })
}
</script>

<template>
  <view class="min-h-screen bg-white text-slate-900">
    <view class="px-4 py-10">
      <view class="mx-auto h-32 w-32 rounded-full border-2 border-slate-300" />
      <text class="mt-5 block text-center text-xl font-semibold tracking-wide text-slate-900">
        {{ member.name }}
      </text>
      <text class="mt-3 block text-center text-base text-slate-600">
        CODE: {{ member.code }}
      </text>
    </view>

    <view class="px-4 py-4">
      <view
        class="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3"
        @tap="goMyPoints"
      >
        <view>
          <text class="block text-xs text-rose-400">
            积分管理
          </text>
          <text class="mt-1 block text-lg font-semibold text-rose-600">
            我的积分
          </text>
        </view>
        <view class="flex items-center justify-center">
          <text class="text-base text-rose-500">查看</text>
        </view>
      </view>
    </view>
  </view>
</template>
