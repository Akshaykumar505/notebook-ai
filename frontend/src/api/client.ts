const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";
export const API_ROOT_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let authToken: string | null = localStorage.getItem("notebook-ai-token");

export function setAuthToken(token: string | null): void {
  authToken = token;
  if (token) {
    localStorage.setItem("notebook-ai-token", token);
  } else {
    localStorage.removeItem("notebook-ai-token");
  }
}

export function getAuthToken(): string | null {
  return authToken;
}

interface RequestOptions {
  method?: "GET" | "POST" | "DELETE" | "PATCH";
  body?: unknown; // plain object -> sent as JSON; FormData -> sent as-is (for file uploads)
}

/**
 * Central fetch wrapper. Every API call in the app goes through this,
 * so auth headers and error handling are consistent everywhere instead
 * of repeated in every component.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body; // let the browser set the multipart Content-Type + boundary
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message = data?.error ?? `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }

  return data as T;
}
