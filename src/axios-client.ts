import axios from "axios";

const getBaseUrl = () => {
  if (typeof window === "undefined") {
    // Server side
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:5204";
  }
  // Client side
  return "";
};

const axiosClient = axios.create({
  baseURL: getBaseUrl(),
});

axiosClient.interceptors.request.use((config) => {
  config.headers["x-csrf"] = "1";
  return config;
});

export default axiosClient;
