<script setup lang="ts">
definePageJson({
  navigationBarTitleText: '首页',
  backgroundColor: '#f6f7fb',
  usingComponents: {
    't-button': 'tdesign-miniprogram/button/button',
  },
})

function goGege() {
  wx.navigateTo({
    url: '/packages/gege/pages/index/index',
  })
}
</script>

<template>
  <view class="min-h-screen bg-background px-4 pb-10 pt-4">
    <view
      class="card overflow-hidden p-5"
      style="background: linear-gradient(135deg, #fff6e9 0%, #fff0f0 56%, #ffffff 100%);"
    >
      <view class="text-[44rpx] font-semibold text-foreground">
        咯咯咯
      </view>
      <view class="mt-2 text-sm leading-6 text-muted-foreground">
        查看个人业绩、团队进展、晋级信息和组织架构，首页直接进入最常用模块。
      </view>
      <t-button class="mt-5" theme="primary" size="large" block @click="goGege">
        进入咯咯咯
      </t-button>
    </view>
  </view>
</template>
