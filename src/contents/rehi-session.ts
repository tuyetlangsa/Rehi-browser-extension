import type { PlasmoCSConfig } from "plasmo"

import { WEB_ORIGIN } from "~config"

export const config: PlasmoCSConfig = {
  matches: ["http://localhost:3000/*"]
}

if (window.location.origin === WEB_ORIGIN) {
  window.addEventListener("message", (event) => {
    if (event.source !== window || event.origin !== WEB_ORIGIN) return
    if (event.data?.type !== "REHI_EXTENSION_SESSION") return
    const { refreshToken } = event.data
    if (typeof refreshToken !== "string" || !refreshToken) return
    chrome.runtime.sendMessage({ type: "setSession", refreshToken })
  })

  chrome.runtime.sendMessage({ type: "getSession" }, (response) => {
    if (!response?.signedIn) {
      window.postMessage({ type: "REHI_EXTENSION_READY" }, WEB_ORIGIN)
    }
  })
}
