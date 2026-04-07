import { API_BASE_URL } from "./config";

type QueryValue = string | number | boolean | null | undefined;
const CSRF_COOKIE_NAME = "csrftoken";
const CSRF_PATH = "auth/session/csrf/";
let csrfBootstrapPromise: Promise<void> | null = null;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function buildErrorMessage(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    if ("detail" in payload) {
      return String((payload as { detail?: unknown }).detail ?? "Request failed");
    }

    const [key, value] = Object.entries(payload as Record<string, unknown>)[0] ?? [];
    if (key) {
      if (Array.isArray(value)) {
        return `${key}: ${value.join(", ")}`;
      }
      return `${key}: ${String(value)}`;
    }
  }

  return "Request failed";
}

function buildUrl(path: string, query?: Record<string, QueryValue>) {
  const url = new URL(path.replace(/^\//, ""), `${API_BASE_URL}/`);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") {
        continue;
      }
      url.searchParams.set(key, String(value));
    }
  }

  return url;
}

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  const cookie = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));

  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : "";
}

async function ensureCsrfCookie() {
  if (readCookie(CSRF_COOKIE_NAME)) {
    return;
  }

  if (!csrfBootstrapPromise) {
    csrfBootstrapPromise = fetch(buildUrl(CSRF_PATH), {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then((response) => {
        if (!response.ok) {
          throw new ApiError("Could not initialize secure session.", response.status);
        }
      })
      .finally(() => {
        csrfBootstrapPromise = null;
      });
  }

  await csrfBootstrapPromise;
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: string;
    query?: Record<string, QueryValue>;
    body?: unknown;
    headers?: HeadersInit;
    signal?: AbortSignal;
    token?: string | null | undefined;
  } = {},
): Promise<T> {
  const method = (options.method ?? "GET").toUpperCase();
  const requiresCsrf = !["GET", "HEAD", "OPTIONS", "TRACE"].includes(method);
  const isFormData = options.body instanceof FormData;
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  if (requiresCsrf) {
    await ensureCsrfCookie();
    const csrfToken = readCookie(CSRF_COOKIE_NAME);
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  if (options.body !== undefined && !isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(buildUrl(path, options.query), {
    method,
    credentials: "include",
    headers,
    body:
      options.body === undefined
        ? undefined
        : isFormData
          ? (options.body as FormData)
          : JSON.stringify(options.body),
    signal: options.signal,
  });

  const contentType = response.headers.get("content-type");
  const payload = contentType?.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(buildErrorMessage(payload), response.status);
  }

  return payload as T;
}
