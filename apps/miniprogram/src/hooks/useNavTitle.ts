import { watchEffect, type Ref } from 'wevu'

type NavTitleValue = string | null | undefined

type NavTitleSource = NavTitleValue | Ref<NavTitleValue> | (() => NavTitleValue)

function isRefTitle(value: NavTitleSource): value is Ref<NavTitleValue> {
  return typeof value === 'object' && value !== null && 'value' in value
}

function resolveTitle(source: NavTitleSource): NavTitleValue {
  if (typeof source === 'function') {
    return source()
  }

  if (isRefTitle(source)) {
    return source.value
  }

  return source
}

export function useNavTitle(source: NavTitleSource) {
  let lastTitle: string | undefined

  watchEffect(() => {
    const title = resolveTitle(source)?.trim()
    if (!title || title === lastTitle) {
      return
    }

    lastTitle = title
    wx.setNavigationBarTitle({
      title,
    })
  })
}
