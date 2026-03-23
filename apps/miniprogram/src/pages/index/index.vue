<script setup lang="ts">
definePageJson({
  navigationBarTitleText: '首页',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-empty': 'tdesign-miniprogram/empty/empty',
  },
})
</script>

<template>
  <view class="flex min-h-screen items-center justify-center bg-slate-100 px-4 pb-12 pt-4">
    <t-empty
      icon="view-list"
      description="快捷进入常用业务页面。"
    />
  </view>
</template>
