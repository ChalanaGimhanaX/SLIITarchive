const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const defaultBaseUrl = import.meta.env.DEV ? "http://localhost:8000/api/v1" : "/api/v1";

export const API_BASE_URL =
  typeof rawBaseUrl === "string" && rawBaseUrl.trim().length > 0
    ? rawBaseUrl.replace(/\/$/, "")
    : defaultBaseUrl;
