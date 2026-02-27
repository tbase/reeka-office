<script setup lang="ts">
import { computed } from 'wevu'

import { useMutation } from '@/hooks/useMutation'
import { useRedeemDetailStore } from '@/stores/points'

definePageJson({
  navigationBarTitleText: '兑换详情',
  backgroundColor: '#f6f7fb',
})

const selectedId = wx.getStorageSync('mine_redeem_item_id') as string
const { detail, refetch, agentCode } = useRedeemDetailStore(selectedId)
const memberPoints = computed(() => detail.value?.memberPoints ?? 0)
const item = computed(() => detail.value?.item ?? {
  id: '',
  name: '',
  cost: 0,
  stock: 0,
  desc: '',
  notes: [],
})

const pointsAfterRedeem = computed(() => memberPoints.value - item.value.cost)
const canRedeem = computed(() => memberPoints.value >= item.value.cost && item.value.stock > 0)

const { mutate: submitRedeem, loading: redeeming } = useMutation('point/submitRedeem', {
  showLoading: '兑换中...',
  onSuccess: async (result) => {
    wx.showToast({
      title: result.message,
      icon: result.success ? 'success' : 'none',
    })
    if (result.success) {
      await refetch()
    }
  },
  onError: (error) => {
    wx.showToast({
      title: error.message || '兑换失败',
      icon: 'none',
    })
  },
})

const handleRedeem = async () => {
  if (!canRedeem.value || redeeming.value) {
    return
  }

  await submitRedeem({
    itemId: item.value.id,
    agentCode: agentCode.value,
  })
}
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-16 pt-4 text-slate-900">
    <view class="rounded-xl bg-white p-4 shadow-lg">
      <text class="block text-lg font-semibold text-slate-900">{{ item.name }}</text>
      <text class="mt-2 block text-sm text-slate-500">{{ item.desc }}</text>

      <view class="mt-4 rounded-lg bg-slate-50 p-3">
        <view class="flex items-center justify-between">
          <text class="text-sm text-slate-500">积分消耗</text>
          <text class="text-sm font-semibold text-rose-500">{{ item.cost }} 积分</text>
        </view>
        <view class="mt-2 flex items-center justify-between">
          <text class="text-sm text-slate-500">当前积分</text>
          <text class="text-sm text-slate-900">{{ memberPoints }}</text>
        </view>
        <view class="mt-2 flex items-center justify-between">
          <text class="text-sm text-slate-500">兑换后剩余</text>
          <text class="text-sm" :class="pointsAfterRedeem >= 0 ? 'text-slate-900' : 'text-red-500'">
            {{ pointsAfterRedeem }}
          </text>
        </view>
        <view class="mt-2 flex items-center justify-between">
          <text class="text-sm text-slate-500">剩余库存</text>
          <text class="text-sm text-slate-900">{{ item.stock }}</text>
        </view>
      </view>
    </view>

    <view class="mt-4 rounded-xl bg-white p-4 shadow-lg">
      <text class="text-base font-semibold text-slate-900">兑换须知</text>
      <text v-for="note in item.notes" :key="note" class="mt-2 block text-sm text-slate-500">
        - {{ note }}
      </text>
    </view>

    <view
      class="mt-4 rounded-xl py-3 text-center"
      :class="canRedeem && !redeeming ? 'bg-rose-500' : 'bg-slate-300'"
      @tap="handleRedeem"
    >
      <text class="text-base font-semibold text-white">{{ redeeming ? '兑换中...' : '马上兑换' }}</text>
    </view>

    <text v-if="!canRedeem" class="mt-2 block text-center text-xs text-slate-400">
      积分不足或库存不足，暂不可兑换
    </text>
  </view>
</template>
