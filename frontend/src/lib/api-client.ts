const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof localStorage === "undefined" ? null : localStorage.getItem("sevasetu-token");
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: {
        ...(!isFormData ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
  } catch {
    const hint = API_BASE === "/api"
      ? "Set VITE_API_URL in Vercel to your Render URL ending in /api, then redeploy the frontend."
      : "Check that the Render API is awake and ALLOWED_ORIGINS includes your exact Vercel site origin, then redeploy the backend.";
    throw new Error(`Could not connect to the SevaSetu API. ${hint}`);
  }
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
