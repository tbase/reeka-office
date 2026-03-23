<script setup lang="ts">
import { computed, ref } from 'wevu'

import { usePointRecordsStore } from '@/stores/points'

definePageJson({
  navigationBarTitleText: '积分明细',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-empty': 'tdesign-miniprogram/empty/empty',
    't-tab-panel': 'tdesign-miniprogram/tab-panel/tab-panel',
    't-tabs': 'tdesign-miniprogram/tabs/tabs',
    't-tag': 'tdesign-miniprogram/tag/tag',
  },
})

type PointRecord = {
  id: string;
  title: string;
  scene: string;
  points: number;
  date: string;
  expired: boolean;
  note: string;
}

const activeFilter = ref<'all' | 'expired'>('all')
const { records } = usePointRecordsStore()
const recordsList = computed<PointRecord[]>(() => records.value ?? [])

const visibleRecords = computed(() => {
  if (activeFilter.value === 'expired') {
    return recordsList.value.filter((record: PointRecord) => record.expired)
  }

  return recordsList.value
})

const setFilter = (filter: 'all' | 'expired') => {
  activeFilter.value = filter
}

const handleFilterChange = (
  event: WechatMiniprogram.CustomEvent<{ value?: string | number }>,
) => {
  const nextValue = event.detail.value

  if (nextValue === 'all' || nextValue === 'expired') {
    setFilter(nextValue)
  }
}
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-16 pt-4 text-slate-900">
    <t-tabs
      theme="card"
      :value="activeFilter"
      @change="handleFilterChange"
    >
      <t-tab-panel value="all" label="全部" />
      <t-tab-panel value="expired" label="已过期" />
    </t-tabs>

    <t-empty
      v-if="visibleRecords.length === 0"
      class="mt-4 rounded-xl bg-white py-8"
      icon="view-list"
      description="当前筛选暂无记录"
    />

    <view v-for="record in visibleRecords" :key="record.id" class="mt-3 rounded-xl bg-white p-4 shadow-lg">
      <view class="flex items-start justify-between">
        <view>
          <view class="block text-base font-semibold text-slate-900">{{ record.title }}</view>
          <view class="mt-1 block text-xs text-slate-400">{{ record.date }} · {{ record.scene }}场景</view>
        </view>
        <view
          class="text-base font-semibold"
          :class="record.points >= 0 ? 'text-emerald-500' : 'text-slate-400'"
        >
          {{ record.points >= 0 ? `+${record.points}` : record.points }}
        </view>
      </view>
      <view class="mt-2 block text-sm text-slate-500">{{ record.note }}</view>
      <t-tag v-if="record.expired" class="mt-2" variant="light">
        已过期
      </t-tag>
    </view>
  </view>
</template>
