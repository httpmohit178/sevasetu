const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof localStorage === "undefined" ? null : localStorage.getItem("sevasetu-token");
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    if (!response.ok) throw new Error(`API request failed (${response.status})`);
    throw new Error('The API URL returned a web page, not JSON. Set VITE_API_URL to your deployed backend URL.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Request failed (${response.status})`);
  return data as T;
}

export async function checkHealth(): Promise<{ status: string; time?: string }> {
  return apiRequest("/health");
}
