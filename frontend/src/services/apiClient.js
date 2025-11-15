import axios from "axios";
import { API_BASE_URL } from "./config";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: simple error logging
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API error:", error?.response || error?.message);
    return Promise.reject(error);
  }
);
