import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return

  if (event.data?.type === "FROM_PAGE") {
    const jwt = event.data.jwt
    chrome.storage.local.set({ jwt: jwt }, () => {
      // JWT saved to local storage
    })
  }
})
