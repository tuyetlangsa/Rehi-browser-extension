import dayjs from "dayjs"
import { parseHTML } from "linkedom"
import { v4 as uuidv4 } from "uuid"

import { isSignedIn, logout, setSession } from "~auth/session"
import { SignedOutError } from "~axios-client"
import { LOGIN_URL, WEB_ORIGIN } from "~config"
import { createHighlight, deleteHighlight, getOrAddDocument } from "~rehi-apis"
import type { GetOrAddDocumentRequest } from "~types/article"
import type { CreateHighlightRequest } from "~types/highlight"

dayjs().format()

const DEBUG_MODE = process.env.DEBUG === "true" || false

export {}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.remove("jwt")
})

const scriptsAlreadyLoaded = async (tabId: number) => {
  try {
    const pingCheck = await chrome.tabs.sendMessage(tabId, {
      message: "ping"
    })
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
        // Error injecting content script
      }

      chrome.tabs.sendMessage(tabId, { type: "get-raw-html" })
    }
  }
})

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === "rawHtml") {
    const payload: GetOrAddDocumentRequest = {
      id: uuidv4(),
      url: message.url,
      rawHtml: message.rawHtml,
      title: message.title,
      createAt: dayjs().valueOf()
    }

    ;(async () => {
      try {
        const result = await getOrAddDocument(payload)
        if (sender.tab?.id) {
          chrome.tabs.sendMessage(sender.tab.id, {
            type: "getOrAddDocumentResult",
            result
          })
        }
      } catch (err) {
        if (err instanceof SignedOutError) {
          chrome.tabs.create({ url: LOGIN_URL })
        }
      }
    })()
  }
  return true
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "getSession") {
    isSignedIn().then((signedIn) => sendResponse({ signedIn }))
    return true
  }
  if (request.type === "logout") {
    logout().then(() => sendResponse({ signedIn: false }))
    return true
  }
  if (request.type === "setSession") {
    const fromWebApp =
      sender.id === chrome.runtime.id && sender.origin === WEB_ORIGIN
    if (!fromWebApp || typeof request.refreshToken !== "string") return
    setSession(request.refreshToken).then(() =>
      sendResponse({ signedIn: true })
    )
    return true
  }
})

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === "createHighlight") {
    const request: CreateHighlightRequest = message.request
    try {
      const apiResult = await createHighlight(request)

      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: "createHighlightResult",
          result: apiResult
        })
      }
    } catch (err) {
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: "createHighlightResult",
          result: {
            isSuccess: false,
            message: err instanceof Error ? err.message : "Unknown error"
          }
        })
      }
    }
  }
})

chrome.runtime.onMessage.addListener(async (message, sender) => {
  if (message.type === "deleteHighlight") {
    const { highlightId, updateAt } = message
    try {
      const apiResult = await deleteHighlight(highlightId, updateAt)

      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: "deleteHighlightResult",
          result: apiResult
        })
      }
    } catch (err) {
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          type: "deleteHighlightResult",
          result: {
            isSuccess: false,
            message: err instanceof Error ? err.message : "Unknown error"
          }
        })
      }
    }
  }
})
