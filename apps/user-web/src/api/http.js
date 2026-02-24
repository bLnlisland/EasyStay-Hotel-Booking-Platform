import axios from "axios";

const baseURL = process.env.REACT_APP_API_BASE || "http://localhost:3000/api";

export const http = axios.create({
  baseURL,
  timeout: 10000,
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
);