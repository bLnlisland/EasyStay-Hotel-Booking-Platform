import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

export const http = axios.create({
  baseURL,
  timeout: 10000,
});

http.interceptors.request.use((config) => {
  const full = (config.baseURL || "") + (config.url || "");
  console.log("[HTTP REQ]", config.method?.toUpperCase(), full, config.params || "");
  return config;
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
);