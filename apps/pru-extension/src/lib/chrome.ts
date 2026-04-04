const SETTINGS_KEY = "pruExtensionSettings"

export type ExtensionSettings = {
  agentCode: string
  workdirName: string
  workdirConnectedAt: string
}

function getChromeApi() {
  if (typeof chrome === "undefined" || !chrome.storage || !chrome.cookies) {
    throw new Error("当前环境不支持 Chrome Extension API")
  }

  return chrome
}

export async function loadSettings(): Promise<ExtensionSettings> {
  const chromeApi = getChromeApi()

  return new Promise((resolve, reject) => {
    chromeApi.storage.local.get([SETTINGS_KEY], (result) => {
      if (chromeApi.runtime.lastError) {
        reject(new Error(chromeApi.runtime.lastError.message))
        return
      }

      const settings = result[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined

      resolve({
        agentCode: settings?.agentCode ?? "",
        workdirName: settings?.workdirName ?? "",
        workdirConnectedAt: settings?.workdirConnectedAt ?? "",
      })
    })
  })
}

export async function saveSettings(settings: ExtensionSettings) {
  const chromeApi = getChromeApi()

  return new Promise<void>((resolve, reject) => {
    chromeApi.storage.local.set({ [SETTINGS_KEY]: settings }, () => {
      if (chromeApi.runtime.lastError) {
        reject(new Error(chromeApi.runtime.lastError.message))
        return
      }

      resolve()
    })
  })
}

export async function getCookiesForUrl(url: string) {
  const chromeApi = getChromeApi()

  return new Promise<chrome.cookies.Cookie[]>((resolve, reject) => {
    chromeApi.cookies.getAll({ url }, (cookies) => {
      if (chromeApi.runtime.lastError) {
        reject(new Error(chromeApi.runtime.lastError.message))
        return
      }

      resolve(cookies)
    })
  })
}
