import axios from "axios";
import { getApiBaseUrl } from "./apiBase";

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const axiosClient = axios.create({
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

axiosClient.interceptors.request.use((config) => {
  if (!config.baseURL) {
    config.baseURL = getApiBaseUrl();
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (typeof config.headers.delete === "function") {
      config.headers.delete("Content-Type");
      config.headers.delete("content-type");
    } else {
      delete config.headers["Content-Type"];
      delete config.headers["content-type"];
    }
  }
  return config;
});

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = String(originalRequest?.url || "");

    // Auth bootstrap / credential endpoints handle their own failures.
    if (
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/session") ||
      url.includes("/auth/logout")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => axiosClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      await axiosClient.post("/auth/refresh");

      processQueue(null);
      return axiosClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Let callers (UserProvider) clear the session. Don't yank the timer
      // page to /login on a failed bootstrap refresh.
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
