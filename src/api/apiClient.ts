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

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}`, config);
  } catch (e) {
    throw new Error("Unable to connect to service. Please check your network connection and try again.");
  }

  let result: unknown = null;

  try {
    result = await response.json();
  } catch {
    result = null;
  }

  if (!response.ok) {
    const payload = result as ApiErrorPayload | null;

    if (
      response.status === 401 &&
      !path.includes("/auth/login") &&
      !path.includes("/auth/register")
    ) {
      localStorage.removeItem("token");
      if (!window.location.pathname.includes("/login")) {
        sessionStorage.setItem("session_expired_toast", "true");
        window.location.replace("/login");
      }
    }

    let errorMessage = payload?.message;
    if (!errorMessage) {
      if (response.status >= 500) {
        errorMessage = "Unable to process request on the server. Please try again.";
      } else if (response.status === 403) {
        errorMessage = "Access Denied: You do not have permissions to perform this action.";
      } else if (response.status === 404) {
        errorMessage = "The requested information was not found.";
      } else {
        errorMessage = `Unable to complete request (Status ${response.status})`;
      }
    }

    const error = new Error(errorMessage) as Error & {
      status?: number;
      errors?: unknown[];
    };

    error.status = response.status;
    error.errors = payload?.errors ?? [];

    throw error;
  }

  return result as T;
}