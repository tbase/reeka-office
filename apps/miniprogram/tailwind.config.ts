import type { Config } from 'tailwindcss'
import { getIconCollections, iconsPlugin } from '@egoist/tailwindcss-icons'

const cssVar = (name: string) => `var(--${name})`

export default {
  content: [
    // 添加你需要提取的文件目录
    'src/**/*.{wxml,js,ts,vue}',
  ],
  theme: {
    extend: {
      colors: {
        background: cssVar('background'),
        foreground: cssVar('foreground'),
        muted: {
          DEFAULT: cssVar('muted'),
          foreground: cssVar('muted-foreground'),
        },
        card: {
          DEFAULT: cssVar('card'),
          foreground: cssVar('card-foreground'),
        },
        border: cssVar('border'),
        input: cssVar('input'),
        primary: {
          DEFAULT: cssVar('primary'),
          foreground: cssVar('primary-foreground'),
        },
        secondary: {
          DEFAULT: cssVar('secondary'),
          foreground: cssVar('secondary-foreground'),
        },
        accent: {
          DEFAULT: cssVar('accent'),
          foreground: cssVar('accent-foreground'),
        },
        destructive: {
          DEFAULT: cssVar('destructive'),
          foreground: cssVar('destructive-foreground'),
        },
        success: cssVar('success'),
        warning: cssVar('warning'),
        ring: cssVar('ring'),
      },
      boxShadow: {
        sm: cssVar('shadow-sm'),
        md: cssVar('shadow-md'),
        lg: cssVar('shadow-lg'),
      },
      borderRadius: {
        sm: cssVar('radius-sm'),
        md: cssVar('radius-md'),
        lg: cssVar('radius-lg'),
        xl: cssVar('radius-xl'),
      },
    },
  },
  plugins: [
    iconsPlugin({
      collections: getIconCollections(['mdi']),
    }),
  ],
  corePlugins: {
    // 小程序不需要 preflight 和 container，因为这主要是给 h5 的，如果你要同时开发小程序和 h5 端，你应该使用环境变量来控制它
    preflight: false,
    container: false,
  },
} satisfies Config
