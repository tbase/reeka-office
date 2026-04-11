<script setup lang="ts">
import { computed } from 'wevu'

import { usePointRuleScenesStore, usePointRulesStore } from '@/stores/points'

definePageJson({
  navigationBarTitleText: '赚取积分',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-col': 'tdesign-miniprogram/col/col',
    't-empty': 'tdesign-miniprogram/empty/empty',
    't-row': 'tdesign-miniprogram/row/row',
    't-tag': 'tdesign-miniprogram/tag/tag',
  },
})

const { scenes } = usePointRuleScenesStore()
const { rules } = usePointRulesStore()
const sceneRows = computed(() => scenes.value ?? [])
const ruleRows = computed(() => rules.value ?? [])
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-16 pt-4">
    <view class="rounded-xl bg-card p-4 shadow-lg">
      <view class="text-lg font-semibold">积分获取场景</view>
      <view class="mt-2 block text-sm text-muted-foreground">
        通过持续完成业务动作可累计积分，以下规则由积分服务下发。
      </view>

      <view class="mt-3 flex flex-wrap gap-2">
        <t-tag
          v-for="scene in sceneRows"
          :key="scene"
          theme="primary"
          variant="light"
          shape="round"
        >
          {{ scene }}
        </t-tag>
      </view>
    </view>

    <t-empty
      v-if="ruleRows.length === 0"
      class="mt-4 rounded-xl bg-card py-8"
      icon="view-list"
      description="暂无积分规则"
    />

    <view v-else class="mt-4 overflow-hidden rounded-xl bg-card shadow-lg">
      <t-row class="bg-muted px-3 py-3 text-xs text-muted-foreground">
        <t-col :span="12">任务</t-col>
        <t-col :span="6" class="text-center">积分</t-col>
        <t-col :span="6" class="text-right">结算方式</t-col>
      </t-row>

      <view
        v-for="row in ruleRows"
        :key="row.task"
        class="border-t border-border px-3 py-3"
      >
        <t-row>
          <t-col :span="12" class="text-sm">{{ row.task }}</t-col>
          <t-col :span="6" class="text-center text-sm font-semibold text-success">{{ row.score }}</t-col>
          <t-col :span="6" class="text-right text-xs text-muted-foreground">{{ row.frequency }}</t-col>
        </t-row>
      </view>
    </view>
  </view>
</template>
