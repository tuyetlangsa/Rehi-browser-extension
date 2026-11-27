import axios from "axios"

import { API_URL } from "~config"

const axiosClient = axios.create({
  baseURL: API_URL
})

axiosClient.interceptors.request.use((config) => {
  config.headers["x-csrf"] = "1"
  return config
})

export default axiosClient
