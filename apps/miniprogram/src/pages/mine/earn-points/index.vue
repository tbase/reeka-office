<script setup lang="ts">
import { computed } from 'wevu'

import { usePointRuleScenesStore, usePointRulesStore } from '@/stores/points'

definePageJson({
  navigationBarTitleText: '赚取积分',
  backgroundColor: '#f6f7fb',
})

const { scenes } = usePointRuleScenesStore()
const { rules } = usePointRulesStore()
const sceneRows = computed(() => scenes.value ?? [])
const ruleRows = computed(() => rules.value ?? [])
</script>

<template>
  <view class="min-h-screen bg-slate-100 px-4 pb-16 pt-4 text-slate-900">
    <view class="rounded-xl bg-white p-4 shadow-lg">
      <text class="text-lg font-semibold text-slate-900">积分获取场景</text>
      <text class="mt-2 block text-sm text-slate-500">
        通过持续完成业务动作可累计积分，以下规则由积分服务下发。
      </text>

      <view class="mt-3 flex flex-wrap gap-2">
        <text
          v-for="scene in sceneRows"
          :key="scene"
          class="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-500"
        >
          {{ scene }}
        </text>
      </view>
    </view>

    <view class="mt-4 overflow-hidden rounded-xl bg-white shadow-lg">
      <view class="grid grid-cols-12 bg-slate-50 px-3 py-3 text-xs text-slate-500">
        <text class="col-span-6">任务</text>
        <text class="col-span-3 text-center">积分</text>
        <text class="col-span-3 text-right">结算方式</text>
      </view>

      <view
        v-for="row in ruleRows"
        :key="row.task"
        class="grid grid-cols-12 border-t border-slate-100 px-3 py-3"
      >
        <text class="col-span-6 text-sm text-slate-900">{{ row.task }}</text>
        <text class="col-span-3 text-center text-sm font-semibold text-emerald-500">{{ row.score }}</text>
        <text class="col-span-3 text-right text-xs text-slate-500">{{ row.frequency }}</text>
      </view>
    </view>
  </view>
</template>
