<script setup lang="ts">
import type { RpcOutput } from '@/lib/rpc'

import { computed, onHide, onLoad, onShareAppMessage, onShow, ref } from 'wevu'
import { useToast } from '@/hooks/useToast'
import { rpc } from '@/lib/rpc'

definePageJson({
  navigationBarTitleText: '邀请成员',
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
    't-toast': 'tdesign-miniprogram/toast/toast',
  },
})

type CreatedInvite = RpcOutput<'identity/createInviteShareToken'>

const { hideLoading, showLoading } = useToast()

const createdInvite = ref<CreatedInvite | null>(null)
const loading = ref(false)
const errorMessage = ref<string | null>(null)

const inviterName = computed(() =>
  createdInvite.value?.inviterName
  ?? '上级代理人',
)
const tenantName = computed(() =>
  createdInvite.value?.tenantName
  ?? '团队',
)
const inviteCardInviterName = computed(() => inviterName.value.toUpperCase())
const activeShareToken = computed(() => createdInvite.value?.token ?? '')
const shareTitle = computed(() => `${inviteCardInviterName.value} 邀请你加入${tenantName.value}`)
const sharePath = computed(() =>
  `/pages/invite/index?shareToken=${encodeURIComponent(activeShareToken.value)}`,
)

async function loadInvite() {
  loading.value = true
  errorMessage.value = null
  showLoading('生成邀请链接中...')

  try {
    const result = await rpc('identity/createInviteShareToken')
    if (!result.success) {
      throw result.error
    }
    createdInvite.value = result.data
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '邀请信息加载失败'
  }
  finally {
    loading.value = false
    hideLoading()
  }
}

onLoad(() => {
  void loadInvite()
})

onShow(() => {
  wx.showShareMenu({
    withShareTicket: false,
    menus: ['shareAppMessage'],
  })
})

onHide(() => {
  wx.hideShareMenu({
    menus: ['shareAppMessage', 'shareTimeline'],
  })
})

onShareAppMessage(() => ({
  title: shareTitle.value,
  path: sharePath.value,
}))
</script>

<template>
  <view class="min-h-screen bg-background px-4 py-5">
    <view v-if="loading" class="mt-5 card p-5 text-center text-sm text-muted-foreground">
      加载中...
    </view>

    <view v-else-if="errorMessage" class="mt-5 card p-5">
      <view class="text-base font-medium">
        邀请不可用
      </view>
      <view class="mt-2 text-sm text-muted-foreground">
        {{ errorMessage }}
      </view>
    </view>

    <view v-else class="mt-8">
      <view class="card bg-primary px-6 py-14 text-center text-primary-foreground">
        <view class="text-lg">
          {{ inviteCardInviterName }}
        </view>
        <view class="mt-4 text-lg font-medium">
          邀请你加入{{ tenantName }}
        </view>
      </view>

      <view class="mx-8 mt-8">
        <t-button
          theme="primary"
          size="large"
          block
          open-type="share"
          :disabled="!activeShareToken"
        >
          分享邀请卡片
        </t-button>
      </view>
    </view>

    <t-toast id="t-toast" />
  </view>
</template>
