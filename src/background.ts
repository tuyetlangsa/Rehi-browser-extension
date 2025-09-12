export {}

chrome.commands.onCommand.addListener((command) => {
  if (command === "get-raw-html") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) return;

      chrome.tabs.sendMessage(
        tabId,
        { type: "get-raw-html" },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Error:", chrome.runtime.lastError);
            return;
          }
          console.log("Raw HTML:", response?.rawHtml);
        }
      );
    });
  }
});