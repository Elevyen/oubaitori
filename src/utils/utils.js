export function buildHeaders(token) {
  const stored = localStorage.getItem('token') ||
    localStorage.getItem('userToken') ||
    sessionStorage.getItem('authToken');

  const t = token || stored;

  const headers = { 'Content-Type': 'application/json' };

  if (t && typeof t === 'string' && t.trim()) {
    headers.Authorization = `Bearer ${t.trim()}`;
  } else {
    // Avisa en la consola si la función se ejecuta sin encontrar un token
    console.warn("buildHeaders: No se encontró ningún token.");
  }

  return headers;
}