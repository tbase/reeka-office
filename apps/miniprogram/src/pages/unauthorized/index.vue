<script setup lang="ts">
import type { TenantSummary } from '@/lib/tenant-session'

import { onShow, ref } from 'wevu'
import { invalidateQueries } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import {
  refreshTenantCatalog,
  switchTenant,
} from '@/lib/rpc/center'
import { getActiveTenantCode } from '@/lib/tenant-session'

definePageJson({
  navigationBarTitleText: '身份绑定',
  navigationBarBackgroundColor: '#ff2056',
  navigationBarTextStyle: 'white',
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
    activeTenantCode.value
      = getActiveTenantCode()
        ?? result.activeTenant?.tenantCode
        ?? result.tenants[0]?.tenantCode
        ?? ''
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
  <view
    class="flex min-h-screen flex-col items-center justify-center bg-background px-4"
  >
    <view class="w-full max-w-sm">
      <view class="mb-8 text-center">
        <view class="block text-2xl font-semibold">
          代理人绑定
        </view>
        <view class="mt-2 block text-sm text-muted-foreground">
          {{
            loadingTenants
              ? "正在加载身份信息"
              : tenants.length
                ? "请选择要进入的团队"
                : "请通过上级代理人的邀请链接加入团队"
          }}
        </view>
      </view>

      <view v-if="!loadingTenants && tenants.length" class="w-full">
        <t-cell-group bordered>
          <t-cell
            v-for="tenant in tenants"
            :key="tenant.tenantCode"
            :title="tenant.tenantName"
            arrow
            @click="handleUseTenant(tenant.tenantCode)"
          />
        </t-cell-group>
      </view>

      <view v-else-if="!loadingTenants" class="card p-5 text-center">
        <view class="text-base font-medium">
          暂无可用身份
        </view>
        <view class="mt-2 text-sm text-muted-foreground">
          必须通过上级代理人的邀请链接加入团队
        </view>
      </view>
    </view>

    <t-toast id="t-toast" />
  </view>
</template>
