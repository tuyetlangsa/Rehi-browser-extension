import { useEffect, useState } from "react"

import { LOGIN_URL } from "~config"

type Status = "loading" | "signedIn" | "signedOut"

export default function RehiPopup() {
  const [status, setStatus] = useState<Status>("loading")

  const applyResponse = (response?: { signedIn: boolean }) =>
    setStatus(response?.signedIn ? "signedIn" : "signedOut")

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "getSession" }, applyResponse)
  }, [])

  return (
    <div
      style={{ padding: 16, minWidth: 220, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ fontSize: 16, margin: "0 0 8px" }}>Rehi</h1>
      {status === "loading" && <p>Checking session...</p>}
      {status === "signedIn" && (
        <>
          <p>Signed in.</p>
          <button
            onClick={() =>
              chrome.runtime.sendMessage({ type: "logout" }, applyResponse)
            }>
            Log out
          </button>
        </>
      )}
      {status === "signedOut" && (
        <>
          <p>Not signed in.</p>
          <button onClick={() => chrome.tabs.create({ url: LOGIN_URL })}>
            Log in
          </button>
        </>
      )}
    </div>
  )
}
