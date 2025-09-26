import { v4 as uuidv4 } from "uuid"

import { getOrAddDocument } from "~rehi-apis"
import type { GetOrAddDocumentRequest } from "~types/article"

export {}

// chrome.commands.onCommand.addListener((command) => {
//   if (command === "get-raw-html") {
//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       const tabId = tabs[0]?.id
//       if (!tabId) return

//       chrome.tabs.sendMessage(tabId, { type: "get-raw-html" })
//     })
//   }
// })

const scriptsAlreadyLoaded = async (tabId: number) => {
  try {
    const pingCheck = await chrome.tabs.sendMessage(tabId, {
      message: "ping"
    })
    console.log("pingCheck: ", pingCheck)
    return true
  } catch {
    return false
  }
}

chrome.commands.onCommand.addListener(async (command) => {
  if (command === "get-raw-html") {
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    })
    if (!activeTab?.id) {
      console.log("No active tab found")
      return
    }
    const tabId = activeTab.id
    if (tabId) {
      try {
        const scriptsLoaded = await scriptsAlreadyLoaded(tabId)
        if (!scriptsLoaded) {
          await chrome.scripting.executeScript({
            target: { tabId },
            files: ["rehi.js"]
          })
        }
      } catch (err) {
        console.log("[Rehi] error injecting content script: ", err)
      }

      chrome.tabs.sendMessage(tabId, { type: "get-raw-html" })
    }
  }
})

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "rawHtml") {
    console.log("Raw HTML received in background:", message.rawHtml)

    const payload: GetOrAddDocumentRequest = {
      id: uuidv4(),
      url: message.url,
      rawHtml: message.rawHtml
    }

    ;(async () => {
      try {
        const result = await payload
        console.log("API result:", result)

        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: "getOrAddDocumentResult",
            result
          })
        }
      } catch (err) {
        console.error("API error:", err)
      }
    })()
  }
  return true
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getJwt") {
    chrome.storage.local.get(["jwt"], ({ jwt }) => {
      console.log({ jwt })
      sendResponse({ jwt })
    })

    return true
  }
})
