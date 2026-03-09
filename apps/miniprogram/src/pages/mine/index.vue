<script setup lang="ts">
import { computed } from 'wevu'

import { usePointSummaryStore } from '@/stores/points'
import { useUserStore } from '@/stores/user'

definePageJson({
  navigationBarTitleText: '我的',
  backgroundColor: '#f6f7fb',
})

const { user } = useUserStore()
const { summary } = usePointSummaryStore()

const member = computed(() => {
  return {
    agentName: user.value?.agentName ?? '',
    agentCode: user.value?.agentCode ?? '',
    avatar: user.value?.avatar ?? null,
    currentPoints: summary.value?.currentPoints ?? '',
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
      <view class="flex items-start gap-3">
        <image
          v-if="member.avatar"
          class="h-14 w-14 shrink-0 rounded-full bg-slate-100"
          mode="aspectFill"
          :src="member.avatar"
        />
        <view
          v-else
          class="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-slate-100"
        >
        </view>

        <view class="flex h-14 min-w-0 flex-1 flex-col justify-between">
          <text class="block text-xl font-semibold tracking-wide text-slate-900">
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
        class="flex items-center justify-between rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3"
        @tap="goMyPoints"
      >
        <view>
          <text class="block text-xs text-rose-400">
            积分管理
          </text>
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
