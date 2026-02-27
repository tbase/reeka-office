<script setup lang="ts">
import { computed } from 'wevu'

import { usePointSummaryStore, useRedeemItemsStore, type RedeemItem } from '@/stores/points'

definePageJson({
  navigationBarTitleText: '我的积分',
  backgroundColor: '#f6f7fb',
})

const { summary } = usePointSummaryStore()
const { items } = useRedeemItemsStore()

const member = computed(() => summary.value ?? {
  name: '',
  totalPoints: 0,
})

const redeemItems = computed<RedeemItem[]>(() => items.value ?? [])

const canRedeemCount = computed(() =>
  redeemItems.value.filter((item: RedeemItem) => member.value.totalPoints >= item.cost).length,
)

const goPointDetail = () => {
  wx.navigateTo({
    url: '/pages/mine/points-detail/index',
  })
}

const goEarnPoints = () => {
  wx.navigateTo({
    url: '/pages/mine/earn-points/index',
  })
}

const goRedeemDetail = (id: string) => {
  wx.setStorageSync('mine_redeem_item_id', id)
  wx.navigateTo({
    url: '/pages/mine/redeem-detail/index',
  })
}
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-16 pt-4 text-slate-900">
    <view class="rounded-xl bg-white p-4 shadow-lg">
      <text class="block text-sm text-slate-500">{{ member.name }}</text>
      <text class="mt-1 block text-3xl font-bold text-slate-900">{{ member.totalPoints }}</text>
      <text class="text-sm text-slate-500">当前积分总额</text>

      <view class="mt-4 grid grid-cols-2 gap-3">
        <view class="rounded-lg bg-slate-50 px-3 py-3" @tap="goPointDetail">
          <text class="block text-sm text-slate-500">查看积分明细</text>
        </view>
        <view class="rounded-lg bg-slate-50 px-3 py-3" @tap="goEarnPoints">
          <text class="block text-sm text-slate-500">如何赚取积分？</text>
        </view>
      </view>
    </view>

    <view class="mt-4 rounded-xl bg-white p-4 shadow-lg">
      <view class="flex items-end justify-between">
        <text class="text-lg font-semibold text-slate-900">积分兑换专区</text>
        <text class="text-xs text-slate-400">可兑换 {{ canRedeemCount }} 项</text>
      </view>

      <view
        v-for="item in redeemItems"
        :key="item.id"
        class="mt-3 rounded-lg border border-slate-100 p-3"
      >
        <text class="block text-base font-semibold text-slate-900">{{ item.name }}</text>
        <text class="mt-1 block text-sm text-slate-500">{{ item.intro }}</text>
        <view class="mt-2 flex items-center justify-between">
          <text class="text-sm text-rose-500">消耗 {{ item.cost }} 积分</text>
          <text class="text-xs text-slate-400">剩余库存 {{ item.stock }}</text>
        </view>
        <view class="mt-3 rounded-md bg-rose-50 py-2 text-center" @tap="goRedeemDetail(item.id)">
          <text class="text-sm font-medium text-rose-500">查看兑换详情</text>
        </view>
      </view>
    </view>
  </view>
</template>
