const API_BASE_URL =
  (import.meta as unknown as { env?: { VITE_API_BASE_URL?: string } }).env
    ?.VITE_API_BASE_URL ?? "http://localhost:8000";

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const url = `${API_BASE_URL}${path}`;
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const body = await res.clone().text().catch(() => "");
      console.error(`[API] ${options?.method ?? "GET"} ${path} -> ${res.status}`, body);
    }
    return res;
  } catch (err) {
    console.error(`[API] ${options?.method ?? "GET"} ${path} NETWORK ERROR`, err);
    throw err;
  }
}
