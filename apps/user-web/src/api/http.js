import axios from "axios";

export const http = axios.create({
  baseURL: "/",
  timeout: 10000,
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
);
