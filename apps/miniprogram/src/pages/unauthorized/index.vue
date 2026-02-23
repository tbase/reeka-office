<script setup lang="ts">
definePageJson({
  navigationBarTitleText: '无访问权限',
  navigationBarBackgroundColor: '#ff2056',
  navigationBarTextStyle: 'white',
})
</script>

<template>
  <view class="flex min-h-screen flex-col items-center justify-center bg-white px-8">
    <view class="text-center">
      <text class="block text-2xl font-semibold text-slate-900">您还不是代理人</text>
      <text class="mt-3 block text-sm text-slate-500">请先完成代理人认证后再使用本应用</text>
    </view>
  </view>
</template>
