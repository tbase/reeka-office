<script setup lang="ts">
import type { TenantSummary } from '@/lib/tenant-session'

import { onShow, ref } from 'wevu'
import { invalidateQueries } from '@/hooks/useQuery'
import { useToast } from '@/hooks/useToast'
import {
  bindByToken,
  refreshTenantCatalog,
  switchTenant,
} from '@/lib/center-api'
import { getActiveTenantCode } from '@/lib/tenant-session'

definePageJson({
  navigationBarTitleText: '身份绑定',
  navigationBarBackgroundColor: '#ff2056',
  navigationBarTextStyle: 'white',
})

const { showToast } = useToast()
const token = ref('')
const binding = ref(false)
const switchingTenantCode = ref('')
const loadingTenants = ref(true)
const tenants = ref<TenantSummary[]>([])
const activeTenantCode = ref('')

async function reloadTenants(showError = false) {
  loadingTenants.value = true

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
  }
}

async function handleBind() {
  const nextToken = token.value.trim().toUpperCase()
  if (!nextToken) {
    showToast('请输入绑定码', 'warning')
    return
  }

  binding.value = true

  try {
    const result = await bindByToken(nextToken)
    tenants.value = result.tenants
    activeTenantCode.value = result.tenantCode
    token.value = ''
    invalidateQueries()
    showToast('绑定成功')
    setTimeout(() => {
      wx.reLaunch({ url: '/pages/index/index' })
    }, 400)
  }
  catch (error) {
    showToast(error instanceof Error ? error.message : '绑定失败', 'error')
  }
  finally {
    binding.value = false
  }
}

function handleTokenChange(event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
  token.value = event.detail.value ?? ''
}

function handleUseTenant(tenantCode: string) {
  if (binding.value || switchingTenantCode.value) {
    return
  }

  if (!tenantCode) {
    showToast('身份无效，请刷新后重试', 'warning')
    return
  }

  switchingTenantCode.value = tenantCode

  const tenant = switchTenant(tenantCode)
  if (!tenant) {
    switchingTenantCode.value = ''
    showToast('身份已失效，请刷新后重试', 'error')
    return
  }

  activeTenantCode.value = tenant.tenantCode
  invalidateQueries()
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
                : "请输入管理员提供的绑定码"
          }}
        </view>
      </view>

      <view
        v-if="loadingTenants"
        class="rounded-xl bg-card px-4 py-8 text-center text-sm text-muted-foreground shadow-md"
      >
        正在加载身份信息...
      </view>

      <view v-else-if="tenants.length" class="w-full">
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

      <view v-else>
        <t-cell-group theme="card" bordered>
          <t-input
            :value="token"
            placeholder="请输入管理员提供的绑定码"
            clearable
            :disabled="binding"
            @change="handleTokenChange"
          />
        </t-cell-group>

        <t-button
          class="mt-6"
          theme="primary"
          size="large"
          block
          :loading="binding"
          :disabled="binding"
          @click="handleBind"
        >
          完成绑定
        </t-button>
      </view>
    </view>

    <t-toast id="t-toast" />
  </view>
</template>
