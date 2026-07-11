const BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

interface ApiErrorPayload {
  message?: string;
  errors?: unknown[];
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const token = localStorage.getItem("token");

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const { body, ...requestOptions } = options;

  const config: RequestInit = {
    ...requestOptions,
    headers,
  };

  if (body !== undefined) {
    config.body =
      typeof body === "string"
        ? body
        : JSON.stringify(body);
  };

  if (options.body !== undefined) {
    config.body =
      typeof options.body === "string"
        ? options.body
        : JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${path}`, config);

  let result: unknown = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    const payload = result as ApiErrorPayload | null;

    const error = new Error(
      payload?.message ??
      `API request failed with status ${response.status}`,
    ) as Error & {
      status?: number;
      errors?: unknown[];
    };

    error.status = response.status;
    error.errors = payload?.errors ?? [];

    throw error;
  }

  return result as T;
}