<script setup lang="ts">
import { onLoad } from 'wevu'
import { hydrateTenantCatalog, switchTenant } from '@/lib/rpc/center'

definePageJson({
  navigationBarTitleText: '加载中',
  backgroundColor: '#f6f7fb',
})

let navigating = false

function replaceTo(url: string) {
  wx.reLaunch({ url })
}

async function resolveLaunchRoute() {
  if (navigating) {
    return
  }

  navigating = true

  const { tenants, activeTenant } = await hydrateTenantCatalog()
  if (tenants.length === 0) {
    replaceTo('/pages/unauthorized/index')
    return
  }

  if (!activeTenant) {
    const tenant = switchTenant(tenants[0].tenantCode)
    if (!tenant) {
      replaceTo('/pages/unauthorized/index')
      return
    }
  }

  replaceTo('/pages/index/index')
}

onLoad(() => {
  void resolveLaunchRoute()
})
</script>

<template>
  <view class="flex min-h-screen items-center justify-center bg-background px-5 text-sm text-muted-foreground">
    正在进入
  </view>
</template>
