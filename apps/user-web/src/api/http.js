import axios from "axios";

export const http = axios.create({
  baseURL: "http://localhost:3000/api",
  timeout: 10000,
});

http.interceptors.response.use(
  (res) => res.data,
  (err) => Promise.reject(err)
);
