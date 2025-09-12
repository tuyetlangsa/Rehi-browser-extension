import type { PlasmoCSConfig } from "plasmo"

export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  all_frames: true
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'get-raw-html':
      collectPageContent().then(rawHtml => {
        sendResponse({ rawHtml: rawHtml });
      });
      return true;
  }
});

const collectPageContent = async (): Promise<string> => {
  const mainContent = document.documentElement.outerHTML
  console.log(mainContent);
  return mainContent;
}
