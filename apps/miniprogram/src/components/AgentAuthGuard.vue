<script setup lang="ts">
import { useUserStore } from '@/stores/user'

// biome-ignore lint/correctness/noUnusedVariables: used in template
const { isLoading, isAgent } = useUserStore()
</script>

<template>
  <view v-if="isLoading" class="flex min-h-screen items-center justify-center bg-slate-50">
    <text class="text-sm text-slate-500">加载中...</text>
  </view>

  <view
    v-else-if="!isAgent"
    class="fixed inset-0 z-50 flex min-h-screen items-center justify-center bg-white/95 px-8"
  >
    <view class="text-center">
      <text class="block text-2xl font-semibold text-slate-900">您还不是代理人</text>
      <text class="mt-3 block text-sm text-slate-500">请先完成代理人认证</text>
    </view>
  </view>

  <slot v-else />
</template>
