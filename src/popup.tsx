import { useEffect, useState } from "react"

export default function RehiPopup() {
  const [jwt, setJwt] = useState<string | null>(null)

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "getJwt" }, (response) => {
      setJwt(response?.jwt || null)
    })
  }, [])

  return (
    <div>
      <h1>{jwt} My Extension</h1>
      <p id="status">{jwt ? "JWT token found!" : "JWT token not found."}</p>
      {!jwt && (
        <button
          id="login"
          onClick={() => {
            chrome.tabs.create({ url: "http://localhost:3000/auth/login" })
          }}>
          Log in
        </button>
      )}
    </div>
  )
}
