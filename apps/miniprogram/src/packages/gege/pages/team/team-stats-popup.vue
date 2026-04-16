<script setup lang="ts">
import { computed } from 'wevu'

import HalfScreenPopup from '@/components/half-screen-popup/index.vue'
import type {
  MetricAmountRow,
  MetricMemberRow,
  MetricRow,
} from '../../components/metric-rows/types'
import MetricRows from '../../components/metric-rows/index.vue'

const props = defineProps<{
  visible: boolean
  periodLabel: string
  summaryItems: MetricMemberRow[]
  summaryMetrics: MetricAmountRow[]
}>()

const emit = defineEmits<{
  (event: 'visible-change', visible: boolean): void
}>()

const title = computed(() => {
  return props.periodLabel
    ? `${props.periodLabel}团队统计`
    : '团队统计'
})

const rows = computed<MetricRow[]>(() => [
  ...props.summaryItems,
  ...props.summaryMetrics,
])

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
    <view class="pb-4">
      <MetricRows :rows="rows" />
    </view>
  </HalfScreenPopup>
</template>
