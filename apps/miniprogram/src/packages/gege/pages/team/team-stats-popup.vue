<script setup lang="ts">
import { computed } from 'wevu'

import HalfScreenPopup from '@/components/half-screen-popup/index.vue'

interface SummaryItem {
  label: string
  value: string
  tone: string
}

interface SummaryMetric {
  label: 'NSC' | 'CASE'
  monthValue: string
  totalValue: string
  tone: string
}

const props = defineProps<{
  visible: boolean
  periodLabel: string
  summaryItems: SummaryItem[]
  summaryMetrics: SummaryMetric[]
}>()

const emit = defineEmits<{
  (event: 'visible-change', visible: boolean): void
}>()

const title = computed(() => {
  return props.periodLabel
    ? `${props.periodLabel}团队统计`
    : '团队统计'
})

function handleVisibleChange(payload: {
  visible?: boolean
}) {
  emit('visible-change', payload.visible ?? false)
}
</script>

<template>
  <HalfScreenPopup
    :visible="props.visible"
    :title="title"
    max-height="76vh"
    max-content-height="52vh"
    @visible-change="handleVisibleChange"
  >
    <view class="space-y-4 pb-4">
      <view class="grid grid-cols-2 gap-2.5">
        <view
          v-for="item in props.summaryItems"
          :key="item.label"
          class="card bg-muted p-2.5 shadow-none"
        >
          <view class="text-xs text-muted-foreground">
            {{ item.label }}
          </view>
          <view class="mt-0.5 text-lg font-semibold" :class="item.tone">
            {{ item.value }}
          </view>
        </view>
      </view>

      <view class="grid grid-cols-2 gap-2.5">
        <view
          v-for="metric in props.summaryMetrics"
          :key="metric.label"
          class="card bg-muted p-2.5 shadow-none"
        >
          <view class="text-xs text-muted-foreground">
            {{ metric.label }}
          </view>
          <view class="mt-0.5 text-lg font-semibold" :class="metric.tone">
            {{ metric.monthValue }}
          </view>
          <view class="mt-0.5 text-xs text-muted-foreground">
            {{ metric.totalValue }}
          </view>
        </view>
      </view>
    </view>
  </HalfScreenPopup>
</template>
