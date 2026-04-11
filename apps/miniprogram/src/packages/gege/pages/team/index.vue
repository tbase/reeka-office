<script setup lang="ts">
import { computed, onLoad, ref } from 'wevu'

import { usePullDownRefresh } from '@/hooks/usePullDownRefresh'
import {
  formatDesignation,
  formatNumber,
  formatPeriod,
  formatQualified,
} from '../../lib/format'
import { useGegeTeamMembersStore } from '../../store'

definePageJson({
  navigationBarTitleText: '我的团队',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-empty': 'tdesign-miniprogram/empty/empty',
  },
})

const activeScope = ref<'direct' | 'all'>('direct')
const { team, isLoading, error, refetch } = useGegeTeamMembersStore(activeScope)

onLoad((options) => {
  if (options?.scope === 'all') {
    activeScope.value = 'all'
  }
})

usePullDownRefresh(async () => {
  await refetch()
})

const summaryItems = computed(() => [
  {
    label: '成员数',
    value: formatNumber(team.value?.summary.memberCount),
    tone: 'text-foreground',
  },
  {
    label: '合资格人数',
    value: formatNumber(team.value?.summary.qualifiedCount),
    tone: 'text-[#0f9d58]',
  },
  {
    label: 'NSC',
    value: formatNumber(team.value?.summary.nsc),
    tone: 'text-[#d9485f]',
  },
  {
    label: 'CASE',
    value: formatNumber(team.value?.summary.netCase),
    tone: 'text-[#dd6b20]',
  },
])

const members = computed(() => team.value?.members ?? [])
const periodLabel = computed(() => formatPeriod(team.value?.period))
const hasPerformance = computed(() => Boolean(team.value?.period))

function changeScope(scope: 'direct' | 'all') {
  if (activeScope.value === scope) {
    return
  }

  activeScope.value = scope
}

function goMemberDetail(agentCode: string) {
  wx.navigateTo({
    url: `/packages/gege/pages/member/index?agentCode=${agentCode}`,
  })
}
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-16 pt-4">
    <view class="card-hero p-5">
      <view class="flex items-center justify-between gap-3">
        <view>
          <view class="text-xl font-semibold text-foreground">
            我的团队
          </view>
          <view class="mt-2 text-sm text-muted-foreground">
            {{ periodLabel }}
          </view>
        </view>

        <view class="inline-flex rounded-full bg-muted p-1">
          <view
            class="pill pill-lg"
            :class="activeScope === 'direct'
              ? 'pill-surface'
              : 'text-muted-foreground'"
            @tap="changeScope('direct')"
          >
            直属
          </view>
          <view
            class="pill pill-lg"
            :class="activeScope === 'all'
              ? 'pill-surface'
              : 'text-muted-foreground'"
            @tap="changeScope('all')"
          >
            全团队
          </view>
        </view>
      </view>
    </view>

    <view v-if="error && !team" class="card mt-4 p-4">
      <t-empty icon="error-circle" :description="error.message || '数据加载失败'" />
    </view>

    <view v-else-if="!hasPerformance && !isLoading" class="card mt-4 p-4">
      <t-empty icon="view-list" description="暂无团队业绩数据" />
    </view>

    <view v-else class="space-y-4">
      <view class="mt-4 grid grid-cols-2 gap-3">
        <view
          v-for="item in summaryItems"
          :key="item.label"
          class="card p-4"
        >
          <view class="text-xs text-muted-foreground">
            {{ item.label }}
          </view>
          <view class="mt-2 text-lg font-semibold" :class="item.tone">
            {{ item.value }}
          </view>
        </view>
      </view>

      <view v-if="members.length === 0" class="card p-4">
        <t-empty icon="view-list" description="当前范围暂无成员" />
      </view>

      <view v-else class="space-y-3">
        <view
          v-for="member in members"
          :key="member.agentCode"
          class="card p-4"
          @tap="goMemberDetail(member.agentCode)"
        >
          <view class="flex items-start justify-between gap-3">
            <view class="min-w-0">
              <view class="text-base font-semibold text-foreground">
                {{ member.name }}
              </view>
              <view class="mt-1 text-sm text-muted-foreground">
                {{ member.agentCode }}
              </view>
            </view>

            <view
              class="pill"
              :class="member.isQualified
                ? 'pill-success'
                : 'pill-warning'"
            >
              {{ formatQualified(member.isQualified) }}
            </view>
          </view>

          <view class="mt-3 flex flex-wrap gap-2 text-xs">
            <view class="pill pill-accent">
              {{ member.relationLabel }}
            </view>
            <view class="pill pill-muted">
              {{ formatDesignation(member.designationName) }}
            </view>
          </view>

          <view class="mt-4 grid grid-cols-2 gap-3">
            <view class="card-soft px-3 py-3">
              <view class="text-xs text-muted-foreground">
                NSC
              </view>
              <view class="mt-1 text-lg font-semibold text-[#d9485f]">
                {{ formatNumber(member.nsc) }}
              </view>
            </view>
            <view class="card-soft px-3 py-3">
              <view class="text-xs text-muted-foreground">
                CASE
              </view>
              <view class="mt-1 text-lg font-semibold text-[#dd6b20]">
                {{ formatNumber(member.netCase) }}
              </view>
            </view>
            <view class="card-soft px-3 py-3">
              <view class="text-xs text-muted-foreground">
                累计 NSC
              </view>
              <view class="mt-1 text-lg font-semibold">
                {{ formatNumber(member.nscSum) }}
              </view>
            </view>
            <view class="card-soft px-3 py-3">
              <view class="text-xs text-muted-foreground">
                累计 CASE
              </view>
              <view class="mt-1 text-lg font-semibold">
                {{ formatNumber(member.netCaseSum) }}
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>
