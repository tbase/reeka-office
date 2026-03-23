<script setup lang="ts">
definePageJson({
  navigationBarTitleText: '培训',
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
      description="该页面由 app.vue 的 TabBar 定义自动补齐，后续可在此接入课程、报名与学习记录。"
    />
  </view>
</template>
