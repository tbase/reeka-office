<script setup lang="ts">
import { computed, onShow } from 'wevu'

import { usePointSummaryStore } from '@/stores/points'
import { useUserStore } from '@/stores/user'

definePageJson({
  navigationBarTitleText: '我的',
  backgroundColor: '#ffffff',
})

const { user, refetch: refetchUser } = useUserStore()
const { summary } = usePointSummaryStore()

const member = computed(() => {
  return {
    agentName: user.value?.agentName ?? '',
    agentCode: user.value?.agentCode ?? '',
    avatar: user.value?.avatar ?? null,
    currentPoints: summary.value?.currentPoints ?? '',
  }
})

onShow(() => {
  void refetchUser()
})

function goAgentSettings() {
  wx.navigateTo({
    url: '/pages/mine/settings/index',
  })
}

function goMyPoints() {
  wx.navigateTo({
    url: '/packages/points/pages/index/index',
  })
}

function goGege() {
  wx.navigateTo({
    url: '/packages/gege/pages/index/index',
  })
}

function goInvite() {
  wx.navigateTo({
    url: '/pages/mine/invite/index',
  })
}
</script>

<template>
  <view class="min-h-screen">
    <view class="mb-4 bg-white px-4 py-6" @tap="goAgentSettings">
      <view class="flex items-start gap-3">
        <image
          v-if="member.avatar"
          class="block shrink-0 rounded-full bg-muted"
          style="width: 96rpx; height: 96rpx;"
          mode="aspectFill"
          :src="member.avatar"
        />
        <view
          v-else
          class="flex shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground"
          style="width: 96rpx; height: 96rpx;"
        >
          头像
        </view>

        <view class="flex min-h-[96rpx] min-w-0 flex-1 flex-col justify-center">
          <view class="block font-semibold tracking-wide">
            {{ member.agentName }}
          </view>
          <view v-if="member.agentCode" class="block text-sm">
            {{ member.agentCode }}
          </view>
        </view>

        <view class="flex min-h-[96rpx] shrink-0 items-center text-muted-foreground">
          <t-icon name="chevron-right" size="40rpx" />
        </view>
      </view>
    </view>

    <view class="pb-4">
      <t-cell-group bordered class="bg-white">
        <t-cell
          title="积分管理"
          :note="`我的积分 ${member.currentPoints}`"
          left-icon="wallet"
          arrow
          @click="goMyPoints"
        />
        <t-cell
          title="咯咯咯"
          left-icon="app"
          arrow
          @click="goGege"
        />
      </t-cell-group>
    </view>

    <view class="pb-4">
      <t-cell-group bordered class="bg-white">
        <t-cell
          title="邀请成员"
          left-icon="usergroup"
          arrow
          @click="goInvite"
        />
      </t-cell-group>
    </view>

    <t-toast id="t-toast" />
  </view>
</template>
