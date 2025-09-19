import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

chrome.runtime.onMessage.addListener((request, sender) => {
  switch (request.type) {
    case 'get-raw-html':
      collectPageContent().then(rawHtml => {
        chrome.runtime.sendMessage({type: "rawHtml", rawHtml: rawHtml, url: window.location.href});
      });
      return true;
  }
});

const collectPageContent = async (): Promise<string> => {
  const mainContent = document.documentElement.outerHTML
  console.log(mainContent);
  return mainContent;
}

// chrome.runtime.onMessage.addListener((message) => {
//   if (message.type === "saveArticleSuccess") {
//     const result = message.result
//     console.log("Received getOrAddDocument result in content script:", result)

//     if (result.isSuccess) {
//       console.log(`Document saved: ${result.data.id}, isSavedBefore: ${result.data.isSavedBefore}`)
//     } else {
//       console.warn("Failed to save document")
//     }
//   }
// })

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "saveArticleSuccess") {
    const result = message.result
    console.log("Received getOrAddDocument result in content script:", result)

    if (result.isSuccess) {
      console.log(`Document saved: ${result.data.id}, isSavedBefore: ${result.data.isSavedBefore}`)

      if (!document.getElementById("rehi-toolbar")) {
        const toolbar = document.createElement("div")
        toolbar.id = "rehi-toolbar"
        toolbar.innerText = result.data.isSavedBefore
          ? "📑 This article was already saved"
          : "✅ Article saved successfully!"

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
          boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
        })

        // Nút close
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