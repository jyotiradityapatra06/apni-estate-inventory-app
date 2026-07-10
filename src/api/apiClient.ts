const BASE_URL = "http://localhost:5000/api";

export interface RequestOptions extends RequestInit {
  body?: any;
}

export async function apiClient<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = localStorage.getItem("token");

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  if (options.body) {
    config.body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }

  const response = await fetch(`${BASE_URL}${path}`, config);

  let result: any;
  try {
    result = await response.json();
  } catch (err) {
    result = null;
  }

  if (!response.ok) {
    const errorMessage = result?.message || `API Request failed with status ${response.status}`;
    const error = new Error(errorMessage) as any;
    error.status = response.status;
    error.errors = result?.errors || [];
    throw error;
  }

  return result;
}
