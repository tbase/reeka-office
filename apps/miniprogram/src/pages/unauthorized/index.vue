<script setup lang="ts">
import type { TenantSummary } from '@/lib/tenant-session'

import { onShow, ref } from 'wevu'
import { invalidateQueries } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import {
  refreshTenantCatalog,
  switchTenant,
} from '@/lib/rpc/center'

definePageJson({
  navigationBarTitleText: '身份状态',
  navigationBarBackgroundColor: '#ff2056',
  navigationBarTextStyle: 'white',
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
    't-cell': 'tdesign-miniprogram/cell/cell',
    't-cell-group': 'tdesign-miniprogram/cell-group/cell-group',
    't-toast': 'tdesign-miniprogram/toast/toast',
  },
})

const { hideLoading, showLoading, showToast } = useToast()
const switchingTenantCode = ref('')
const loadingTenants = ref(true)
const tenants = ref<TenantSummary[]>([])
const activeTenantCode = ref('')

async function reloadTenants(showError = false) {
  loadingTenants.value = true
  showLoading('加载身份信息中...')

  try {
    const result = await refreshTenantCatalog()
    tenants.value = result.tenants
    activeTenantCode.value = result.activeTenant?.tenantCode ?? ''
  }
  catch (error) {
    if (showError) {
      showToast(
        error instanceof Error ? error.message : '租户加载失败',
        'error',
      )
    }
  }
  finally {
    loadingTenants.value = false
    hideLoading()
  }
}

function handleUseTenant(tenantCode: string) {
  if (switchingTenantCode.value) {
    return
  }

  if (!tenantCode) {
    showToast('身份无效，请刷新后重试', 'warning')
    return
  }

  switchingTenantCode.value = tenantCode
  showLoading('切换身份中...')

  const tenant = switchTenant(tenantCode)
  if (!tenant) {
    switchingTenantCode.value = ''
    hideLoading()
    showToast('身份已失效，请刷新后重试', 'error')
    return
  }

  activeTenantCode.value = tenant.tenantCode
  invalidateQueries()
  switchingTenantCode.value = ''
  hideLoading()
  showToast(`已切换到${tenant.tenantName}`)
  setTimeout(() => {
    wx.reLaunch({ url: '/pages/index/index' })
  }, 300)
}

onShow(() => {
  wx.hideHomeButton()
  reloadTenants()
})
</script>

<template>
  <view class="flex min-h-screen flex-col bg-background px-5 py-10">
    <view
      v-if="loadingTenants"
      class="flex flex-1 items-center justify-center text-sm text-muted-foreground"
    >
      正在加载身份信息
    </view>

    <view v-else-if="tenants.length" class="w-full">
      <view class="mb-6">
        <view class="text-2xl font-semibold">
          选择身份
        </view>
        <view class="mt-2 text-sm text-muted-foreground">
          请选择要进入的团队
        </view>
      </view>

      <t-cell-group bordered>
        <t-cell
          v-for="tenant in tenants"
          :key="tenant.tenantCode"
          :title="tenant.tenantName"
          :note="tenant.tenantCode === activeTenantCode ? '当前' : ''"
          arrow
          @click="handleUseTenant(tenant.tenantCode)"
        />
      </t-cell-group>
    </view>

    <view v-else class="flex flex-1 flex-col items-center justify-center text-center">
      <view class="text-lg font-semibold text-destructive">
        暂无可用身份
      </view>
      <view class="mt-3 text-sm leading-6 text-muted-foreground">
        请通过上级代理人分享的邀请链接加入团队
      </view>
      <view class="mt-8 w-full">
        <t-button
          theme="light"
          size="large"
          block
          shape="rectangle"
          @click="reloadTenants(true)"
        >
          刷新身份
        </t-button>
      </view>
    </view>

    <t-toast id="t-toast" />
  </view>
</template>
