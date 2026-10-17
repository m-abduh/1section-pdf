import axios, { AxiosError } from "axios";
import { clearToken, getToken } from "./auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      window.location.pathname.startsWith("/admin") &&
      !window.location.pathname.endsWith("/login")
    ) {
      clearToken();
      window.location.href = "/admin/login";
    }
    return Promise.reject(error);
  },
);

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { error?: { message?: string } }
      | undefined;
    return data?.error?.message ?? error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Something went wrong";
}
