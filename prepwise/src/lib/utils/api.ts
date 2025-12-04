import { getSession } from "../auth/client";

// Helper to make authenticated API requests
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const session = await getSession();
  
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  return fetch(url, {
    ...options,
    headers,
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

