<script setup lang="ts">
import type { RpcOutput } from '@/lib/rpc'

import { computed } from 'wevu'

import HalfScreenPopup from '@/components/half-screen-popup/index.vue'
import {
  formatMetricValue,
  formatMonth,
  formatQualified,
  formatRate,
} from '../../lib/format'

type PersonalHistoryItem = RpcOutput<'gege/getMyPerformanceHistory'>['history'][number]

const props = defineProps<{
  visible: boolean
  item: PersonalHistoryItem | null
  showNextQualification: boolean
}>()

const emit = defineEmits<{
  (event: 'visible-change', visible: boolean): void
}>()

const title = computed(() => {
  if (!props.item) {
    return ''
  }

  return `${formatMonth(props.item.month)} 指标明细`
})

const qualificationRows = computed(() => {
  if (!props.item) {
    return []
  }

  const rows = [
    {
      label: '本月资格',
      value: props.item.isQualified
        ? formatQualified(true)
        : formatMetricValue(props.item.qualifiedGap),
      tone: props.item.isQualified ? 'text-success' : 'text-warning-foreground',
    },
  ]

  if (props.showNextQualification && props.item.isQualifiedNextMonth != null) {
    rows.push({
      label: '下月资格',
      value: props.item.isQualifiedNextMonth
        ? formatQualified(true)
        : formatMetricValue(props.item.qualifiedGapNextMonth),
      tone: props.item.isQualifiedNextMonth ? 'text-success' : 'text-warning-foreground',
    })
  }

  return rows
})

const metricRows = computed(() => {
  if (!props.item) {
    return []
  }

  return [
    { label: 'NSC', value: formatMetricValue(props.item.nsc) },
    { label: 'NSC SUM', value: formatMetricValue(props.item.nscSum) },
    { label: 'CASE', value: formatMetricValue(props.item.netCase) },
    { label: 'CASE SUM', value: formatMetricValue(props.item.netCaseSum) },
    { label: 'AFYP', value: formatMetricValue(props.item.netAfyp) },
    { label: 'AFYP SUM', value: formatMetricValue(props.item.netAfypSum) },
    { label: 'AFYC SUM', value: formatMetricValue(props.item.netAfycSum) },
    { label: 'NSC HP', value: formatMetricValue(props.item.nscHp) },
    { label: 'NSC HP SUM', value: formatMetricValue(props.item.nscHpSum) },
    { label: 'AFYP HP', value: formatMetricValue(props.item.netAfypHp) },
    { label: 'AFYP HP SUM', value: formatMetricValue(props.item.netAfypHpSum) },
    { label: 'AFYP H', value: formatMetricValue(props.item.netAfypH) },
    { label: 'AFYP H SUM', value: formatMetricValue(props.item.netAfypHSum) },
    { label: 'CASE H', value: formatMetricValue(props.item.netCaseH) },
    { label: 'CASE H SUM', value: formatMetricValue(props.item.netCaseHSum) },
    { label: '团队续保率', value: formatRate(props.item.renewalRateTeam) },
  ]
})

function handleVisibleChange(payload: {
  visible?: boolean
}) {
  emit('visible-change', payload.visible ?? false)
}
</script>

<template>
  <HalfScreenPopup
    v-if="props.item"
    :visible="props.visible"
    :title="title"
    max-height="82vh"
    max-content-height="62vh"
    @visible-change="handleVisibleChange"
  >
    <view class="space-y-4 pb-4">
      <view>
        <view class="mb-3 text-sm font-semibold text-foreground">
          资格信息
        </view>
        <t-cell-group bordered class="card-list overflow-hidden">
          <t-cell
            v-for="row in qualificationRows"
            :key="row.label"
            :title="row.label"
          >
            <template #note>
              <view class="text-sm font-semibold" :class="row.tone">
                {{ row.value }}
              </view>
            </template>
          </t-cell>
        </t-cell-group>
      </view>

      <view>
        <view class="mb-3 text-sm font-semibold text-foreground">
          指标信息
        </view>
        <t-cell-group bordered class="card-list overflow-hidden">
          <t-cell
            v-for="row in metricRows"
            :key="row.label"
            :title="row.label"
            :note="row.value"
          />
        </t-cell-group>
      </view>
    </view>
  </HalfScreenPopup>
</template>
