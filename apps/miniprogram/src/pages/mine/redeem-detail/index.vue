<script setup lang="ts">
import { computed } from 'wevu'

import { useMutation } from '@/hooks/useMutation'
import { invalidateQueries } from '@/hooks/useQuery'
import { usePointSummaryStore, useRedeemItemStore } from '@/stores/points'

definePageJson({
  navigationBarTitleText: '兑换详情',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
    't-cell': 'tdesign-miniprogram/cell/cell',
    't-cell-group': 'tdesign-miniprogram/cell-group/cell-group',
    't-tag': 'tdesign-miniprogram/tag/tag',
  },
})

const selectedId = wx.getStorageSync('mine_redeem_item_id') as string
const { summary, refetch: refetchSummary } = usePointSummaryStore()
const { items, refetch: refetchItem } = useRedeemItemStore(selectedId)

const memberPoints = computed(() => summary.value?.currentPoints ?? 0)
const item = computed(
  () => {
    const rawItem = items.value?.[0]

    return {
      id: rawItem?.id ?? '',
      redeemCategory: rawItem?.redeemCategory ?? '',
      title: rawItem?.title ?? '商品未找到',
      description: rawItem?.description ?? '',
      redeemPoints: rawItem?.redeemPoints ?? 0,
      stock: rawItem?.stock ?? 0,
      maxRedeemPerAgent: rawItem?.maxRedeemPerAgent ?? 1,
      redeemedCount: rawItem?.redeemedCount ?? 0,
      imageUrl: rawItem?.imageUrl,
      notice: rawItem?.notice ?? '',
    }
  }
)

const pointsAfterRedeem = computed(() => memberPoints.value - item.value.redeemPoints)
const redeemLimitReached = computed(() => item.value.redeemedCount >= item.value.maxRedeemPerAgent)
const canRedeem = computed(() =>
  memberPoints.value >= item.value.redeemPoints
  && item.value.stock > 0
  && !redeemLimitReached.value,
)

const { mutate: submitRedeem, loading: redeeming } = useMutation('points/submitRedeem', {
  showLoading: '兑换中...',
  onSuccess: async (result) => {
    wx.showToast({
      title: result.message,
      icon: result.success ? 'success' : 'none',
    })

    if (!result.success) {
      return
    }

    invalidateQueries('points/getMineSummary')
    invalidateQueries('points/listRedeemItems')
    await Promise.all([refetchSummary(), refetchItem()])
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
  })
}
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-16 pt-4 text-slate-900">
    <view class="rounded-xl bg-white p-4 shadow-lg">
      <t-tag theme="primary" variant="light" shape="round">
        {{ item.redeemCategory || '默认分类' }}
      </t-tag>
      <image
        v-if="item.imageUrl"
        class="mt-3 h-40 w-full rounded-lg bg-slate-100"
        mode="aspectFill"
        :src="item.imageUrl"
      />
      <view class="mt-2 block text-lg font-semibold text-slate-900">{{ item.title }}</view>
      <view class="mt-2 block text-sm text-slate-500">{{ item.description }}</view>

      <t-cell-group class="mt-4" theme="card" bordered>
        <t-cell title="积分消耗" :note="`${item.redeemPoints} 积分`" />
        <t-cell title="当前积分" :note="`${memberPoints}`" />
        <t-cell title="兑换后剩余" :note="`${pointsAfterRedeem}`" />
        <t-cell title="剩余库存" :note="`${item.stock}`" />
        <t-cell title="每人限兑" :note="`${item.maxRedeemPerAgent} 次`" />
        <t-cell title="已兑换次数" :note="`${item.redeemedCount} 次`" />
        <t-cell
          v-if="item.notice"
          title="兑换说明"
          :description="item.notice"
        />
      </t-cell-group>
    </view>

    <t-button
      class="mt-4"
      theme="primary"
      size="large"
      block
      :loading="redeeming"
      :disabled="!canRedeem || redeeming"
      @click="handleRedeem"
    >
      {{ redeeming ? '兑换中...' : '马上兑换' }}
    </t-button>

    <view v-if="!canRedeem" class="mt-2 block text-center text-xs text-slate-400">
      积分不足、库存不足或已达限兑次数，暂不可兑换
    </view>
  </view>
</template>
