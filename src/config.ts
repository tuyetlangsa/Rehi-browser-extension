export const API_URL =
  process.env.PLASMO_PUBLIC_API_URL ?? "http://localhost:5204"

export const WEB_URL =
  process.env.PLASMO_PUBLIC_WEB_URL ?? "http://localhost:3000"

export const WEB_ORIGIN = new URL(WEB_URL).origin
