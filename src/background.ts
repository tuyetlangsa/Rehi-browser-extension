import { getOrAddDocument } from "~rehi-apis"
import type { GetOrAddDocumentRequest } from "~types/article"
import { v4 as uuidv4 } from "uuid"

export {}

chrome.commands.onCommand.addListener((command) => {
  if (command === "get-raw-html") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id
      if (!tabId) return

      chrome.tabs.sendMessage(tabId, { type: "get-raw-html" })
    })
  }
})

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "rawHtml") {

    console.log("Raw HTML received in background:", message.rawHtml)

     const payload: GetOrAddDocumentRequest = {
      id: uuidv4(),
      url: message.url,
      rawHtml: message.rawHtml,
    }

    ;(async () => {
      try {
        const result = await getOrAddDocument(payload)
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
})
