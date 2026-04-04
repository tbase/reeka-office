const APP_PAGE = chrome.runtime.getURL("index.html")

async function openOrFocusAppPage() {
  const tabs = await chrome.tabs.query({ url: APP_PAGE })
  const existingTab = tabs[0]

  if (existingTab?.id) {
    await chrome.tabs.update(existingTab.id, { active: true })

    if (typeof existingTab.windowId === "number") {
      await chrome.windows.update(existingTab.windowId, { focused: true })
    }

    return
  }

  await chrome.tabs.create({ url: APP_PAGE })
}

chrome.action.onClicked.addListener(() => {
  void openOrFocusAppPage()
})
