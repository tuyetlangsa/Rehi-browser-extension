import { API_URL } from "~config"

type StoredSession = { refreshToken: string }

type AccessToken = { value: string; expiresAt: number }

type TokenPair = {
  accessToken: string
  accessTokenExpiresAt: number
  refreshToken: string
  refreshTokenExpiresAt: number
}

const STORAGE_KEY = "rehiSession"
const EXPIRY_MARGIN_MS = 60_000

let accessToken: AccessToken | null = null
let inflight: Promise<string | null> | null = null

async function readRefreshToken(): Promise<string | null> {
  const stored = await chrome.storage.local.get(STORAGE_KEY)
  const session = stored[STORAGE_KEY] as StoredSession | undefined
  return session?.refreshToken ?? null
}

async function writeRefreshToken(refreshToken: string) {
  const session: StoredSession = { refreshToken }
  await chrome.storage.local.set({ [STORAGE_KEY]: session })
}

function postAuth(path: string, refreshToken: string) {
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken })
  })
}

function parseTokenPair(body: unknown): TokenPair {
  const pair = (body as { data?: Partial<TokenPair> } | null)?.data
  if (
    typeof pair?.accessToken !== "string" ||
    typeof pair.accessTokenExpiresAt !== "number" ||
    typeof pair.refreshToken !== "string" ||
    typeof pair.refreshTokenExpiresAt !== "number"
  ) {
    throw new Error("Malformed token pair from /auth/refresh")
  }
  return pair as TokenPair
}

async function revoke(refreshToken: string) {
  try {
    await postAuth("/auth/logout", refreshToken)
  } catch {}
}

async function refresh(): Promise<string | null> {
  const refreshToken = await readRefreshToken()
  if (!refreshToken) return null

  const response = await postAuth("/auth/refresh", refreshToken)
  if (response.status === 401) {
    await chrome.storage.local.remove(STORAGE_KEY)
    accessToken = null
    return null
  }
  if (!response.ok) {
    throw new Error(`Rehi session refresh failed with ${response.status}`)
  }

  const pair = parseTokenPair(await response.json())
  await writeRefreshToken(pair.refreshToken)
  accessToken = {
    value: pair.accessToken,
    expiresAt: pair.accessTokenExpiresAt
  }
  return accessToken.value
}

export async function getAccessToken(): Promise<string | null> {
  if (accessToken && accessToken.expiresAt - EXPIRY_MARGIN_MS > Date.now()) {
    return accessToken.value
  }
  inflight ??= refresh().finally(() => {
    inflight = null
  })
  return inflight
}

export function dropAccessToken() {
  accessToken = null
}

export async function isSignedIn(): Promise<boolean> {
  return (await readRefreshToken()) !== null
}

export async function setSession(refreshToken: string) {
  await inflight?.catch(() => null)
  const previous = await readRefreshToken()
  await writeRefreshToken(refreshToken)
  accessToken = null
  if (previous && previous !== refreshToken) await revoke(previous)
}

export async function logout() {
  await inflight?.catch(() => null)
  const refreshToken = await readRefreshToken()
  await chrome.storage.local.remove(STORAGE_KEY)
  accessToken = null
  if (refreshToken) await revoke(refreshToken)
}
