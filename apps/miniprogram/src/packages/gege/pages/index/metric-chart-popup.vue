<script setup lang="ts">
import { computed } from 'wevu'

import HalfScreenPopup from '@/components/half-screen-popup/index.vue'
import { formatCompactMetricValue } from '../../lib/format'
import { useGegeMetricChartStore } from '../../store'

const props = defineProps<{
  visible: boolean
  title: string
  year: number | null
  metric: {
    scope: 'self' | 'direct' | 'all'
    metricName: 'nsc' | 'netCase'
    label: 'NSC' | 'CASE'
  } | null
}>()

const emit = defineEmits<{
  (event: 'visible-change', visible: boolean): void
}>()

const enabled = computed(() => props.visible)
const chartYear = computed(() => props.year)
const chartMetricName = computed(() => props.metric?.metricName ?? null)
const chartScope = computed(() => props.metric?.scope ?? null)

const { chart, isLoading, error, refetch } = useGegeMetricChartStore(
  chartYear,
  chartMetricName,
  chartScope,
  enabled,
)

const points = computed(() => chart.value?.points ?? [])
const BAR_MAX_HEIGHT_PERCENT = 82

const maxValue = computed(() => {
  const values = points.value.map(item => item.value)

  return Math.max(...values, 0)
})

const barToneClass = computed(() => {
  return props.metric?.metricName === 'nsc'
    ? 'bg-primary'
    : 'bg-primary-2'
})

const bars = computed(() => {
  const safeMaxValue = Math.max(maxValue.value, 1)

  return points.value.map((item) => {
    const ratio = item.value / safeMaxValue
    const heightPercent = item.value > 0
      ? Math.max(ratio * BAR_MAX_HEIGHT_PERCENT, 8)
      : 2

    return {
      ...item,
      label: `${String(item.month).padStart(2, '0')}`,
      heightPercent,
      labelBottom: `${heightPercent}%`,
      formattedValue: formatCompactMetricValue(item.value),
    }
  })
})

function handleVisibleChange(payload: {
  visible?: boolean
}) {
  emit('visible-change', payload.visible ?? false)
}

function handleRetry() {
  void refetch()
}
</script>

<template>
  <HalfScreenPopup
    :visible="props.visible"
    :title="props.title"
    max-height="78vh"
    max-content-height="56vh"
    @visible-change="handleVisibleChange"
  >
    <view class="pb-4">
      <view
        v-if="isLoading"
        class="flex h-64 items-center justify-center text-sm text-muted-foreground"
      >
        加载中...
      </view>

      <view
        v-else-if="error"
        class="flex h-64 flex-col items-center justify-center gap-3"
      >
        <view class="text-sm text-muted-foreground">
          {{ error.message || '图表数据加载失败' }}
        </view>
        <view class="pill pill-card" @tap="handleRetry">
          重试
        </view>
      </view>

      <view
        v-else-if="bars.length === 0"
        class="flex h-64 items-center justify-center text-sm text-muted-foreground"
      >
        暂无图表数据
      </view>

      <scroll-view v-else scroll-x class="mt-4 whitespace-nowrap">
        <view class="inline-flex min-w-full gap-3 pb-1">
          <view
            v-for="item in bars"
            :key="item.month"
            class="flex w-12 shrink-0 flex-col items-center"
          >
            <view class="relative flex h-44 w-full items-end justify-center">
              <view
                class="pointer-events-none absolute left-1/2 z-10 w-full -translate-x-1/2 text-center text-[10px] leading-tight text-muted-foreground"
                :style="`bottom: calc(${item.labelBottom} + 2px); transform: translateX(-50%);`"
              >
                {{ item.formattedValue }}
              </view>
              <view
                class="w-8 rounded-t-lg"
                :class="barToneClass"
                :style="`height: ${item.heightPercent}%`"
              />
            </view>
            <view class="mt-2 text-xs text-muted-foreground">
              {{ item.label }}
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </HalfScreenPopup>
</template>
