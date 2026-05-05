// src/api/entries.js
import { buildHeaders } from '../utils/utils.js';

const API_BASE = import.meta.env?.VITE_LOCAL_BACKEND || '';

/**
 * Helpers de parseo seguro
 */
async function readTextSafe(res) {
  try {
    return await res.text();
  } catch {
    return '';
  }
}

async function parseJsonSafe(res) {
  const text = await readTextSafe(res);
  const contentType = res.headers?.get('content-type') || '';

  if (!res.ok) {
    // Si el error es 401, el mensaje probablemente sea {"ok":false,"error":"sin_token"}
    const err = new Error(text || `HTTP ${res.status}`);
    err.status = res.status;
    err.raw = text;
    throw err;
  }

  if (!contentType.includes('application/json')) {
    const err = new Error(text || `Non-JSON response (content-type: ${contentType})`);
    err.status = res.status;
    err.raw = text;
    throw err;
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    const err = new Error('Invalid JSON response from server');
    err.status = res.status;
    err.raw = text;
    throw err;
  }
}

/**
 * GET /api/registros?month=YYYY-MM
 *
 * Implementación robusta y compatible:
 * - Añade timeout con AbortController
 * - Loggea status y body (truncado) para depuración
 * - Intenta parsear JSON de forma tolerante y normaliza formatos comunes
 * - Devuelve siempre un Array (o []) para mantener compatibilidad con el resto del código
 *
 * Nota: no se cambian las otras funciones del módulo.
 */
export async function fetchEntriesByMonth(month, token) {
  const DEFAULT_TIMEOUT_MS = 10000; // 10s

  if (!month) {
    console.warn('fetchEntriesByMonth: month vacío');
    return [];
  }

  const q = new URLSearchParams({ month }).toString();
  const url = `${API_BASE}/api/registros?${q}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const headers = buildHeaders ? buildHeaders(token) : { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };

    const res = await fetch(url, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Leer body como texto para poder loguearlo y parsearlo con tolerancia
    let bodyText = '';
    try {
      bodyText = await res.text();
    } catch (e) {
      bodyText = '';
    }

    // Logs útiles para depuración (truncar body para no saturar consola)
    try {
      console.debug('fetchEntriesByMonth - url:', url);
      console.debug('fetchEntriesByMonth - status:', res.status);
      console.debug('fetchEntriesByMonth - bodyText (trunc):', typeof bodyText === 'string' ? bodyText.slice(0, 2000) : bodyText);
    } catch (e) {
      // no bloquear por errores de logging
    }

    // Intentar parsear JSON si el content-type lo indica o si el body parece JSON
    let parsed = null;
    const contentType = res.headers?.get('content-type') || '';
    if (contentType.includes('application/json') || (bodyText && (bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[')))) {
      try {
        parsed = bodyText ? JSON.parse(bodyText) : null;
      } catch (e) {
        console.warn('fetchEntriesByMonth: fallo parseando JSON, bodyText (trunc):', bodyText.slice(0, 500));
        parsed = null;
      }
    } else {
      // No es JSON; devolver texto crudo en un objeto para depuración
      parsed = bodyText || null;
    }

    // Si el status no es OK, devolver lo que tenga sentido (array si viene, o [] en fallback)
    if (!res.ok) {
      console.warn('fetchEntriesByMonth: respuesta HTTP no OK', { status: res.status, parsed });
      if (Array.isArray(parsed)) return parsed;
      if (parsed && Array.isArray(parsed.registros)) return parsed.registros;
      if (parsed && Array.isArray(parsed.entries)) return parsed.entries;
      return [];
    }

    // Normalizar formatos comunes y devolver siempre un array (o [])
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.registros)) return parsed.registros;
    if (parsed && Array.isArray(parsed.entries)) return parsed.entries;
    if (parsed && parsed.data && Array.isArray(parsed.data.registros)) return parsed.data.registros;
    if (parsed && parsed.data && Array.isArray(parsed.data.entries)) return parsed.data.entries;

    // Si el servidor devolvió un objeto sin arrays esperados, intentar extraer arrays anidados
    // o devolver [] para mantener compatibilidad.
    // Log para depuración
    console.warn('fetchEntriesByMonth: respuesta no contiene array esperado, devolviendo []', parsed);
    return [];
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.error('fetchEntriesByMonth: timeout/abort', err);
    } else {
      console.error('fetchEntriesByMonth: fetch error', err);
    }

    // Intentar fallback a cache local si existe
    try {
      const raw = localStorage.getItem('entradasCache_v1') || localStorage.getItem('entradasCache');
      if (raw) {
        const parsedCache = JSON.parse(raw);
        if (Array.isArray(parsedCache)) {
          console.debug('fetchEntriesByMonth: usando cache local como fallback, count:', parsedCache.length);
          return parsedCache;
        }
      }
    } catch (e) {
      console.warn('fetchEntriesByMonth: error leyendo cache local', e);
    }

    return [];
  }
}

/**
 * GET /api/registros/:id
 */
export async function fetchEntryById(id, token) {
  if (!id) throw new Error('id requerido');
  const url = `${API_BASE}/api/registros/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    headers: buildHeaders(token)
  });
  return parseJsonSafe(res);
}

/**
 * POST /api/registros
 */
export async function createEntry(payload, token) {
  const url = `${API_BASE}/api/registros`;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify(payload)
  });
  return parseJsonSafe(res);
}

/**
 * PUT /api/registros/:id
 */
export async function updateEntry(id, payload, token) {
  if (!id) throw new Error('id requerido para update');
  const url = `${API_BASE}/api/registros/${encodeURIComponent(id)}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: buildHeaders(token),
    body: JSON.stringify(payload)
  });
  return parseJsonSafe(res);
}

/**
 * POST /api/registros/sincronizar
 */
export async function syncPending(items = [], token) {
  const url = `${API_BASE}/api/registros/sincronizar`;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(token),
    body: JSON.stringify({ items })
  });
  return parseJsonSafe(res);
}