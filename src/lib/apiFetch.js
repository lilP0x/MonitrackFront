// Helper para centralizar fetch con token, base URL y manejo de errores
const RAW_API_URL = import.meta.env.VITE_API_URL;
// If VITE_API_URL is empty or not set, use relative paths (frontend will call /api/...)
const API_URL = RAW_API_URL === undefined || RAW_API_URL === "" ? "" : RAW_API_URL.replace(/\/+$/, "");

async function handleResponse(response) {
  if (response.status === 204) return null;
  const ct = response.headers.get("content-type") || "";
  if (ct.includes("application/json")) return response.json();
  return response.text();
}

export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});

  if (token) headers.set("Authorization", `Bearer ${token}`);

  // Ensure we don't duplicate slashes when concatenating
  const url = API_URL ? `${API_URL}${path}` : path;
  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 401 || res.status === 403) {
    // token inválido/expirado: limpiar y propagar error para que la UI lo maneje
    localStorage.removeItem("token");
    const err = new Error("Unauthorized");
    err.response = res;
    throw err;
  }

  if (!res.ok) {
    const body = await handleResponse(res).catch(() => null);
    const msg = body && body.message ? body.message : res.statusText || "Error";
    const err = new Error(msg);
    err.response = res;
    err.body = body;
    throw err;
  }

  return handleResponse(res);
}

export async function apiFetchJson(path, body, options = {}) {
  return apiFetch(path, {
    method: options.method || "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
  });
}

export async function apiFetchText(path, text, options = {}) {
  return apiFetch(path, {
    method: options.method || "PUT",
    headers: {
      "Content-Type": "text/plain",
      ...(options.headers || {}),
    },
    body: text,
  });
}
