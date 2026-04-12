<script setup lang="ts">
import { onLaunch, onShow } from 'wevu'
import { hydrateTenantCatalog } from '@/lib/center-api'
import { RpcErrorCode, setRpcErrorHandler } from '@/lib/rpc'

import '@/styles/theme-light.less'

setRpcErrorHandler((error) => {
  if (error.code === RpcErrorCode.FORBIDDEN) {
    const currentPages = getCurrentPages()
    const currentPage = currentPages[currentPages.length - 1]
    const currentRoute = `/${currentPage?.route ?? ''}`

    if (currentRoute === '/pages/unauthorized/index') {
      return
    }

    wx.reLaunch({ url: '/pages/unauthorized/index' })
  }
})

defineAppJson({
  pages: [
    'pages/index/index',
    'pages/product/index',
    'pages/resource/index',
    'pages/resource/detail/index',
    'pages/training/index',
    'pages/mine/index',
    'pages/unauthorized/index',
  ],
  subPackages: [
    {
      root: 'packages/gege',
      pages: [
        'pages/index/index',
        'pages/personal/index',
        'pages/team/index',
        'pages/member/index',
      ],
    },
    {
      root: 'packages/points',
      pages: [
        'pages/index/index',
        'pages/detail/index',
        'pages/earn/index',
      ],
    },
  ],
  window: {
    navigationBarTitleText: '海纳API | 家族办公室',
    navigationBarBackgroundColor: '#e23a3b',
    navigationBarTextStyle: 'white',
    backgroundTextStyle: 'dark',
  },
  tabBar: {
    color: '#7a7aa0',
    selectedColor: '#e23a3b',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '首页',
        iconPath: 'tabbar/home.png',
        selectedIconPath: 'tabbar/home-active.png',
      },
      {
        pagePath: 'pages/product/index',
        text: '产品',
        iconPath: 'tabbar/product.png',
        selectedIconPath: 'tabbar/product-active.png',
      },
      {
        pagePath: 'pages/resource/index',
        text: '资源',
        iconPath: 'tabbar/resource.png',
        selectedIconPath: 'tabbar/resource-active.png',
      },
      {
        pagePath: 'pages/training/index',
        text: '培训',
        iconPath: 'tabbar/training.png',
        selectedIconPath: 'tabbar/training-active.png',
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的',
        iconPath: 'tabbar/mine.png',
        selectedIconPath: 'tabbar/mine-active.png',
      },
    ],
  },
  style: 'v2',
  componentFramework: 'glass-easel',
  sitemapLocation: 'sitemap.json',
  resolveAlias: {
    '@/*': '/*',
  },
})

async function syncTenantRoute() {
  const { activeTenant } = await hydrateTenantCatalog()
  const currentPages = getCurrentPages()
  const currentPage = currentPages[currentPages.length - 1]
  const currentRoute = `/${currentPage?.route ?? ''}`

  if (!activeTenant && currentRoute !== '/pages/unauthorized/index') {
    wx.reLaunch({ url: '/pages/unauthorized/index' })
  }
}

onLaunch(() => {
  void syncTenantRoute()
})

onShow(() => {
  void syncTenantRoute()
})
</script>

<style lang="postcss">
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .card {
    @apply rounded-lg bg-card text-card-foreground shadow-lg;
  }

  .pill {
    @apply inline-flex items-center rounded-full px-3 py-1 text-xs font-medium;
  }

  .pill-lg {
    @apply px-4 py-2 text-sm;
  }

  .pill-primary {
    @apply bg-primary text-primary-foreground;
  }

  .pill-accent {
    @apply bg-accent text-accent-foreground;
  }

  .pill-muted {
    @apply bg-muted text-muted-foreground;
  }

  .pill-success {
    @apply bg-success-soft text-success-foreground;
  }

  .pill-warning {
    @apply bg-warning-soft text-warning-foreground;
  }

  .pill-selected {
    @apply bg-primary text-primary-foreground shadow-sm;
  }

  .pill-surface {
    @apply bg-card text-foreground shadow-sm;
  }

  .pill-card {
    @apply bg-card text-muted-foreground shadow-sm;
  }
}

page {
  font-family: 'HarmonyOS Sans', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  --background: var(--td-bg-color-page);
  --foreground: var(--td-text-color-primary);
  --muted: var(--td-bg-color-secondarycontainer);
  --muted-foreground: var(--td-text-color-secondary);
  --card: var(--td-bg-color-container);
  --card-foreground: var(--td-text-color-primary);
  --border: var(--td-border-level-1-color);
  --input: var(--td-component-border);
  --primary: var(--td-brand-color);
  --primary-2: var(--td-warning-color);
  --primary-foreground: var(--td-text-color-anti);
  --secondary: var(--td-bg-color-secondarycontainer);
  --secondary-foreground: var(--td-text-color-primary);
  --accent: var(--td-brand-color-light);
  --accent-foreground: var(--td-text-color-brand);
  --destructive: var(--td-error-color);
  --destructive-foreground: var(--td-text-color-anti);
  --success: var(--td-success-color);
  --success-soft: var(--td-success-color-light);
  --success-foreground: var(--td-success-color);
  --warning: var(--td-warning-color);
  --warning-soft: var(--td-warning-color-light);
  --warning-foreground: var(--td-warning-color);
  --ring: var(--td-brand-color-focus);
  --shadow-sm: var(--td-shadow-4);
  --shadow-md: var(--td-shadow-1);
  --shadow-lg: var(--td-shadow-2);
  --radius-sm: var(--td-radius-small, 6rpx);
  --radius-md: var(--td-radius-default, 12rpx);
  --radius-lg: var(--td-radius-large, 18rpx);
  --radius-xl: var(--td-radius-extraLarge, 24rpx);
  --hero-start: var(--td-brand-color-light);
  --hero-middle: var(--td-warning-color-light);
  --hero-end: var(--td-bg-color-container);

  background-color: var(--background);
  color: var(--foreground);
}

.pb-safe {
  padding-bottom: env(safe-area-inset-bottom);
}

.pb-safe-1 {
  padding-bottom: calc(env(safe-area-inset-bottom) + 8rpx);
}

.pb-safe-2 {
  padding-bottom: calc(env(safe-area-inset-bottom) + 16rpx);
}
</style>
