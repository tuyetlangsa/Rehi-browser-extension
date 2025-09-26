import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"]
}

window.addEventListener("message", (event) => {
  console.log("tao có chạy nha1")
  if (event.source !== window) return

  if (event.data?.type === "FROM_PAGE") {
    console.log("tao có chạy nha2")
    const jwt = event.data.jwt
    console.log(jwt)
    console.log(chrome.storage)
    chrome.storage.local.set({ jwt: jwt }, () => {
      console.log("JWT saved to local storage", jwt)
    })
  }
})
