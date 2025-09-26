import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

window.addEventListener("message", (event) => {
  if (event.source !== window) return

  if (event.data?.type === "FROM_PAGE") {
    const jwt = event.data.jwt
    console.log(jwt)
    console.log(chrome.storage)
    chrome.storage.local.set({ jwt: jwt }, () => {
      console.log("JWT saved to local storage", jwt)
    })
  }
})
