import { getSession } from "../auth/client";

// Helper to make authenticated API requests
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const session = await getSession();
  
  // Build headers object with proper typing
  // Handle different header types: Headers object, array of tuples, or plain object
  const baseHeaders: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Convert existing headers to plain object
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        baseHeaders[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        if (typeof key === "string" && typeof value === "string") {
          baseHeaders[key] = value;
        }
      });
    } else if (typeof options.headers === "object") {
      Object.assign(baseHeaders, options.headers);
    }
  }

  if (session?.access_token) {
    baseHeaders["Authorization"] = `Bearer ${session.access_token}`;
  }

  // Create new options object without headers to avoid conflicts
  const { headers: _unused, ...restOptions } = options;
  
  return fetch(url, {
    ...restOptions,
    headers: baseHeaders,
  });
}

// Helper to handle API responses
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

