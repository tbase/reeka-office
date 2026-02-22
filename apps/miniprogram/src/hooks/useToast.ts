import Toast, { type ToastOptionsType } from 'tdesign-miniprogram/toast/index'
import { getCurrentInstance } from 'wevu'

export interface ToastOptions {
  selector?: string
  duration?: number
  theme?: ToastOptionsType['theme']
}

export function useToast(options: ToastOptions = {}) {
  const mpContext = getCurrentInstance()
  const selector = options.selector ?? '#t-toast'
  const duration = options.duration ?? 1200
  const defaultTheme = options.theme ?? 'success'

  function showToast(message: string, theme: ToastOptionsType['theme'] = defaultTheme) {
    if (!mpContext) {
      return
    }
    Toast({
      selector,
      context: mpContext as any,
      message,
      theme,
      duration,
    })
  }

  return {
    showToast,
  }
}
