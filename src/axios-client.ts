import axios from "axios"

import { dropAccessToken, getAccessToken } from "~auth/session"
import { API_URL } from "~config"

export class SignedOutError extends Error {
  constructor() {
    super("Not signed in to Rehi")
  }
}

const axiosClient = axios.create({
  baseURL: API_URL
})

axiosClient.interceptors.request.use(async (config) => {
  const token = await getAccessToken()
  if (!token) throw new SignedOutError()
  config.headers.Authorization = `Bearer ${token}`
  config.headers["x-csrf"] = "1"
  return config
})

axiosClient.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    dropAccessToken()
  }
  throw error
})

export default axiosClient
