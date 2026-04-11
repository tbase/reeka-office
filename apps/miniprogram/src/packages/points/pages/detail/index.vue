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

interface PointRecord {
  id: string
  title: string
  scene: string
  points: number
  date: string
  type: 'grant' | 'redeem'
  expired: boolean
  note: string
}

const activeFilter = ref<'all' | 'grant' | 'redeem'>('all')
const { records } = usePointRecordsStore()
const recordsList = computed<PointRecord[]>(() => records.value ?? [])

const visibleRecords = computed(() => {
  if (activeFilter.value === 'all') {
    return recordsList.value
  }

  return recordsList.value.filter((record: PointRecord) => record.type === activeFilter.value)
})

function setFilter(filter: 'all' | 'grant' | 'redeem') {
  activeFilter.value = filter
}

function handleFilterChange(event: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
  const nextValue = event.detail.value

  if (nextValue === 'all' || nextValue === 'grant' || nextValue === 'redeem') {
    setFilter(nextValue)
  }
}
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-16 pt-4">
    <t-tabs
      theme="card"
      :value="activeFilter"
      @change="handleFilterChange"
    >
      <t-tab-panel value="all" label="全部" />
      <t-tab-panel value="grant" label="发放" />
      <t-tab-panel value="redeem" label="兑换" />
    </t-tabs>

    <t-empty
      v-if="visibleRecords.length === 0"
      class="mt-4 rounded-xl bg-card py-8"
      icon="view-list"
      description="当前筛选暂无记录"
    />

    <view v-for="record in visibleRecords" :key="record.id" class="mt-3 rounded-xl bg-card p-4 shadow-lg">
      <view class="flex items-start justify-between">
        <view>
          <view class="block text-base font-semibold">
            {{ record.title }}
          </view>
          <view class="mt-1 block text-xs text-muted-foreground">
            {{ record.date }} · {{ record.scene }}场景
          </view>
        </view>
        <view
          class="text-base font-semibold"
          :class="record.points >= 0 ? 'text-success' : 'text-muted-foreground'"
        >
          {{ record.points >= 0 ? `+${record.points}` : record.points }}
        </view>
      </view>
      <view class="mt-2 block text-sm text-muted-foreground">
        {{ record.note }}
      </view>
      <view class="mt-2 flex items-center gap-2">
        <t-tag
          class="mt-0"
          variant="light"
          :theme="record.type === 'grant' ? 'success' : 'warning'"
        >
          {{ record.type === 'grant' ? '发放' : '兑换' }}
        </t-tag>
        <t-tag v-if="record.expired" class="mt-0" variant="light">
          已过期
        </t-tag>
      </view>
    </view>
  </view>
</template>
