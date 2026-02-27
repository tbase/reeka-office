<script setup lang="ts">
import { computed, ref } from 'wevu'

import { usePointRecordsStore, type PointRecord } from '@/stores/points'

definePageJson({
  navigationBarTitleText: '积分明细',
  backgroundColor: '#f6f7fb',
})

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
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-16 pt-4 text-slate-900">
    <view class="rounded-xl bg-white p-3 shadow-lg">
      <view class="flex rounded-lg bg-slate-100 p-1">
        <view
          class="flex-1 rounded-md py-2 text-center"
          :class="activeFilter === 'all' ? 'bg-white' : ''"
          @tap="setFilter('all')"
        >
          <text class="text-sm" :class="activeFilter === 'all' ? 'text-slate-900' : 'text-slate-500'">全部</text>
        </view>
        <view
          class="flex-1 rounded-md py-2 text-center"
          :class="activeFilter === 'expired' ? 'bg-white' : ''"
          @tap="setFilter('expired')"
        >
          <text class="text-sm" :class="activeFilter === 'expired' ? 'text-slate-900' : 'text-slate-500'">已过期</text>
        </view>
      </view>
    </view>

    <view v-if="visibleRecords.length === 0" class="mt-4 rounded-xl bg-white p-4 text-center shadow-lg">
      <text class="text-sm text-slate-500">当前筛选暂无记录</text>
    </view>

    <view v-for="record in visibleRecords" :key="record.id" class="mt-3 rounded-xl bg-white p-4 shadow-lg">
      <view class="flex items-start justify-between">
        <view>
          <text class="block text-base font-semibold text-slate-900">{{ record.title }}</text>
          <text class="mt-1 block text-xs text-slate-400">{{ record.date }} · {{ record.scene }}场景</text>
        </view>
        <text
          class="text-base font-semibold"
          :class="record.points >= 0 ? 'text-emerald-500' : 'text-slate-400'"
        >
          {{ record.points >= 0 ? `+${record.points}` : record.points }}
        </text>
      </view>
      <text class="mt-2 block text-sm text-slate-500">{{ record.note }}</text>
      <text v-if="record.expired" class="mt-2 inline-block rounded bg-slate-100 px-2 py-1 text-xs text-slate-500">
        已过期
      </text>
    </view>
  </view>
</template>
