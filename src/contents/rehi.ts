import dayjs from "dayjs"
import type { PlasmoCSConfig } from "plasmo"
import { v4 as uuidv4 } from "uuid"

import type { SelectionData } from "~types/highlight"
import {
  getElementPath,
  getSelectionHTML,
  htmlToMarkdown
} from "~utils/highlight-utils"

// Configure content script to exclude localhost:3000 (Rehi web app)
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  exclude_matches: [
    "http://localhost:3000/*",
    "https://localhost:3000/*",
    "http://127.0.0.1:3000/*",
    "https://127.0.0.1:3000/*"
  ]
}

// Handle ping message even on localhost:3000 to prevent background script errors
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "ping") {
    sendResponse({ status: "pong" })
    return true
  }
})

// Early exit if on localhost:3000 - prevents any interference
if (
  (window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1") &&
  window.location.port === "3000"
) {
  console.log("Extension: Exiting on localhost:3000 to prevent interference")
  // Don't execute any extension code
} else {
  // Extension code only runs on non-localhost:3000 pages

  // State management
  let currentArticleId: string | null = null
  let isHighlightingActive = false
  let currentSelection: SelectionData | null = null
  let selectionMenu: HTMLElement | null = null

  // Highlight colors
  const HIGHLIGHT_COLORS = [
    {
      name: "Yellow",
      value: "rgba(251, 191, 36, 0.2)",
      bgClass: "bg-yellow-400"
    },
    {
      name: "Green",
      value: "rgba(16, 185, 129, 0.2)",
      bgClass: "bg-emerald-500"
    },
    { name: "Blue", value: "rgba(59, 130, 246, 0.2)", bgClass: "bg-blue-500" },
    {
      name: "Purple",
      value: "rgba(139, 92, 246, 0.2)",
      bgClass: "bg-violet-500"
    },
    { name: "Pink", value: "rgba(236, 72, 153, 0.2)", bgClass: "bg-pink-500" }
  ]

  chrome.runtime.onMessage.addListener((request, sender) => {
    switch (request.type) {
      case "get-raw-html":
        collectPageContent().then((rawHtml) => {
          const ogTitle = document
            .querySelector('meta[property="og:title"]')
            ?.getAttribute("content")
          const pageTitle = document.title
          const h1Title = document.querySelector("h1")?.textContent?.trim()

          // Ưu tiên: OG title > document.title > h1
          const title = ogTitle || pageTitle || h1Title || "Untitled"
          chrome.runtime.sendMessage({
            type: "rawHtml",
            rawHtml: rawHtml,
            url: window.location.href,
            title: title.trim()
          })
        })
        return true
    }
  })

  const collectPageContent = async (): Promise<string> => {
    const mainContent = document.documentElement.outerHTML
    console.log(mainContent)
    return mainContent
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "getOrAddDocumentResult") {
      const result = message.result
      console.log("Received getOrAddDocument result in content script:", result)

      if (result.isSuccess) {
        console.log(
          `Document saved: ${result.data.id}, isSavedBefore: ${result.data.isSavedBefore}`
        )

        // Store article ID and activate highlighting
        currentArticleId = result.data.id
        isHighlightingActive = true

        console.log("Highlighting activated for article:", currentArticleId)

        if (!document.getElementById("rehi-toolbar")) {
          const toolbar = document.createElement("div")
          toolbar.id = "rehi-toolbar"
          toolbar.innerText = result.data.isSavedBefore
            ? "📑 This article was already saved - Highlighting enabled!"
            : "✅ Article saved successfully! - Highlighting enabled!"

          // Style cho toolbar
          Object.assign(toolbar.style, {
            position: "fixed",
            top: "0",
            left: "0",
            width: "100%",
            background: "#4CAF50",
            color: "white",
            textAlign: "center",
            padding: "10px",
            zIndex: "9999",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            boxShadow: "0 2px 5px rgba(0,0,0,0.3)"
          })

          const closeBtn = document.createElement("span")
          closeBtn.innerText = "✖"
          closeBtn.style.marginLeft = "10px"
          closeBtn.style.cursor = "pointer"
          closeBtn.onclick = () => toolbar.remove()

          toolbar.appendChild(closeBtn)
          document.body.appendChild(toolbar)

          setTimeout(() => {
            toolbar.remove()
          }, 5000)
        }
      } else {
        console.warn("Failed to save document")
      }
    }
  })

  // Selection detection and highlight functionality
  function extractSelectionData(selection: Selection): SelectionData | null {
    if (!selection.rangeCount) return null

    const range = selection.getRangeAt(0)

    const { stringPath: startStringPath, arrayPath: startArrayPath } =
      getElementPath(range.startContainer)
    const { stringPath: endStringPath, arrayPath: endArrayPath } =
      getElementPath(range.endContainer)

    // Create location string in format: "<startPath>:<startOffset>,<endPath>:<endOffset>"
    const location = `${startStringPath}:${range.startOffset},${endStringPath}:${range.endOffset}`

    console.log("Generated location:", location)
    console.log("Start path:", startStringPath, "offset:", range.startOffset)
    console.log("End path:", endStringPath, "offset:", range.endOffset)

    const text = selection.toString()
    const html = getSelectionHTML(range)
    const markdown = htmlToMarkdown(html)

    return {
      location,
      text,
      html,
      markdown,
      startArrayPath,
      endArrayPath,
      startStringPath,
      endStringPath
    }
  }

  function isSelectionInContainer(
    selection: Selection,
    container: Element
  ): boolean {
    if (!selection.rangeCount) return false

    const range = selection.getRangeAt(0)

    return (
      container.contains(range.startContainer) &&
      container.contains(range.endContainer)
    )
  }

  function createSelectionMenu(rect: DOMRect, isReverse: boolean): HTMLElement {
    console.log(
      "Creating selection menu with rect:",
      rect,
      "isReverse:",
      isReverse
    )

    const menu = document.createElement("div")
    menu.id = "rehi-selection-menu"

    const offset = 8
    const vertical = 0
    const left =
      (isReverse ? rect.left - offset : rect.right + offset) + window.scrollX
    const top = rect.top + window.scrollY - vertical

    console.log("Menu position - left:", left, "top:", top)

    Object.assign(menu.style, {
      position: "absolute",
      left: `${left}px`,
      top: `${top}px`,
      zIndex: "50",
      display: "flex",
      alignItems: "center",
      gap: "8px",
      background: "#262626",
      border: "1px solid #404040",
      borderRadius: "6px",
      padding: "8px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      fontFamily: "Arial, sans-serif"
    })

    // Highlight button
    const highlightBtn = document.createElement("button")
    highlightBtn.innerHTML = "🖍️"
    highlightBtn.style.height = "28px"
    highlightBtn.style.padding = "0 8px"
    highlightBtn.style.background = "#3b82f6"
    highlightBtn.style.color = "white"
    highlightBtn.style.border = "none"
    highlightBtn.style.borderRadius = "4px"
    highlightBtn.style.cursor = "pointer"
    highlightBtn.style.fontSize = "14px"

    highlightBtn.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()

      const defaultColor = HIGHLIGHT_COLORS[0].value

      console.log("Highlight button clicked with color:", defaultColor)
      handleSaveHighlight(defaultColor)
    })

    menu.appendChild(highlightBtn)

    // Prevent menu from interfering with selection
    menu.addEventListener("mousedown", (e) => {
      e.preventDefault()
      e.stopPropagation()
    })

    menu.addEventListener("click", (e) => {
      e.stopPropagation()
    })

    console.log("Menu created successfully:", menu)
    return menu
  }

  function handleSaveHighlight(color: string) {
    console.log("handleSaveHighlight called with color:", color)
    console.log("currentSelection:", currentSelection)
    console.log("currentArticleId:", currentArticleId)

    if (!currentSelection || !currentArticleId) {
      console.log("Missing selection or article ID")
      return
    }

    const id = uuidv4()
    const now = dayjs().valueOf()

    const request = {
      id,
      articleId: currentArticleId,
      location: currentSelection.location,
      html: currentSelection.html,
      markdown: currentSelection.markdown,
      plainText: currentSelection.text,
      color: color,
      createAt: now,
      createBy: "rehi-browser-extension" as const
    }

    console.log("Sending highlight request:", request)

    // Send to background script
    chrome.runtime.sendMessage({
      type: "createHighlight",
      request
    })

    clearSelection()
  }

  function clearSelection() {
    currentSelection = null
    if (selectionMenu) {
      selectionMenu.remove()
      selectionMenu = null
    }
    document.getSelection()?.removeAllRanges()
  }

  function handleMouseUp() {
    if (!isHighlightingActive) return

    console.log("Mouse up detected, highlighting active:", isHighlightingActive)

    // Add a longer delay to ensure selection is fully established and user has finished selecting
    setTimeout(() => {
      const sel = document.getSelection()
      console.log("Selection after mouseup:", sel)
      console.log("Selection collapsed:", sel?.isCollapsed)
      console.log("Selection range count:", sel?.rangeCount)

      if (!sel || sel.isCollapsed || sel.rangeCount <= 0) {
        console.log("No valid selection found")
        // Only clear if there's an existing menu
        if (selectionMenu) {
          clearSelection()
        }
        return
      }

      // Check if selection is within body tag
      if (!isSelectionInContainer(sel, document.body)) {
        console.log("Selection not within body")
        // Only clear if there's an existing menu
        if (selectionMenu) {
          clearSelection()
        }
        return
      }

      const selectionData = extractSelectionData(sel)
      if (!selectionData) {
        console.log("Failed to extract selection data")
        // Only clear if there's an existing menu
        if (selectionMenu) {
          clearSelection()
        }
        return
      }

      console.log("Valid selection found:", selectionData)
      currentSelection = selectionData

      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      const isReverse =
        range.startContainer === sel.focusNode &&
        range.endOffset === sel.anchorOffset

      console.log("Creating selection menu at:", rect)

      // Remove existing menu
      if (selectionMenu) {
        selectionMenu.remove()
      }

      // Create new menu
      selectionMenu = createSelectionMenu(rect, isReverse)
      document.body.appendChild(selectionMenu)
      console.log("Selection menu created and added to DOM")
    }, 100) // Increased delay to ensure selection is complete
  }

  // Handle highlight creation result
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "createHighlightResult") {
      const result = message.result
      console.log("Received createHighlight result:", result)

      if (result.isSuccess) {
        console.log("Highlight created successfully")
        // Show success notification
        showNotification("✅ Highlight saved successfully!", "success")
      } else {
        console.warn("Failed to create highlight:", result.message)
        showNotification(
          "❌ Failed to save highlight: " + result.message,
          "error"
        )
      }
    }
  })

  function showNotification(message: string, type: "success" | "error") {
    const notification = document.createElement("div")
    notification.innerText = message

    Object.assign(notification.style, {
      position: "fixed",
      top: "60px",
      right: "20px",
      background: type === "success" ? "#4CAF50" : "#f44336",
      color: "white",
      padding: "12px 16px",
      borderRadius: "4px",
      zIndex: "10000",
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
      maxWidth: "300px",
      wordWrap: "break-word"
    })

    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  // Add mouseup event listener
  document.addEventListener("mouseup", handleMouseUp)

  // Add click listener to close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (selectionMenu && !selectionMenu.contains(e.target as Node)) {
      // Only clear if the click is not on a text selection
      const sel = document.getSelection()
      if (!sel || sel.isCollapsed || sel.rangeCount <= 0) {
        clearSelection()
      }
    }
  })
} // End of else block - extension code only runs on non-localhost:3000 pages
