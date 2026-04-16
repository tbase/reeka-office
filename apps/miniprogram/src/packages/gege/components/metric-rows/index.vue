<script setup lang="ts">
import type { MetricRow } from './types'

const props = defineProps<{
  rows: MetricRow[]
}>()

const emit = defineEmits<{
  (event: 'row-tap', row: MetricRow): void
}>()

function handleRowTap(row: MetricRow) {
  emit('row-tap', row)
}
</script>

<template>
  <view class="overflow-hidden rounded-lg bg-card">
    <view
      v-for="row in props.rows"
      :key="row.label"
      class="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0"
      @tap="handleRowTap(row)"
    >
      <view
        class="w-14 shrink-0 text-xs text-muted-foreground"
      >
        {{ row.label }}
      </view>

      <template v-if="row.kind === 'amount'">
        <view class="grid min-w-0 flex-1 grid-cols-2 gap-3 text-right">
          <view class="min-w-0">
            <view class="text-[10px] text-muted-foreground">
              当月
            </view>
            <view
              class="break-all text-sm leading-tight"
            >
              {{ row.monthValue }}
            </view>
          </view>
          <view class="min-w-0">
            <view class="text-[10px] text-muted-foreground">
              累计
            </view>
            <view class="break-all text-sm leading-tight text-foreground">
              {{ row.totalValue }}
            </view>
          </view>
        </view>
      </template>

      <view v-else-if="row.kind === 'qualification'" class="grid min-w-0 flex-1 grid-cols-2 gap-3 text-right">
        <view class="min-w-0">
          <view class="text-[10px] text-muted-foreground">
            当月
          </view>
          <view class="break-all text-sm leading-tight" :class="row.isQualified ? 'text-success' : 'text-warning'">
            {{ row.isQualified ? '✓' : row.qualifiedGap }}
          </view>
        </view>
        <view class="min-w-0">
          <view class="text-[10px] text-muted-foreground">
            下月
          </view>
          <view class="break-all text-sm leading-tight" :class="row.isQualifiedNextMonth ? 'text-success' : 'text-warning'">
            {{ row.isQualifiedNextMonth ? '✓' : row.qualifiedGapNextMonth }}
          </view>
        </view>
      </view>

      <view v-else class="grid min-w-0 flex-1 grid-cols-2 gap-3 text-right">
        <view class="min-w-0">
          <view class="text-[10px] text-muted-foreground">
            合资格
          </view>
          <view class="break-all text-sm font-medium leading-tight text-success">
            {{ row.qualifiedValue }}
          </view>
        </view>
        <view class="min-w-0">
          <view class="text-[10px] text-muted-foreground">
            全部
          </view>
          <view class="break-all text-sm font-medium leading-tight text-foreground">
            {{ row.totalValue }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
