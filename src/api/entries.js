import { buildHeaders } from '../utils/utils.js';

const API_BASE = import.meta.env?.VITE_LOCAL_BACKEND || '';

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
    // Si el error es 401, el mensaje sera {"ok":false,"error":"sin_token"}
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
 * Normalización mínima y no destructiva de una entrada para que el resto del flujo
 * siempre encuentre `emociones` (array), `intensidad` (Number|null) y `nota` (string|null)
 */
function normalizeEntryForAnalysis(e) {
  const raw = e || {};

  // extraer emociones desde múltiples rutas
  let emociones = [];
  if (Array.isArray(raw.emociones)) emociones = raw.emociones;
  else if (Array.isArray(raw.emotions)) emociones = raw.emotions;
  else if (raw.suggested && Array.isArray(raw.suggested.emociones)) emociones = raw.suggested.emociones;
  else if (raw.suggested && Array.isArray(raw.suggested.emotions)) emociones = raw.suggested.emotions;
  else if (raw.analysis && raw.analysis.suggested && Array.isArray(raw.analysis.suggested.emociones)) emociones = raw.analysis.suggested.emociones;
  else if (raw.analysis && raw.analysis.suggested && Array.isArray(raw.analysis.suggested.emotions)) emociones = raw.analysis.suggested.emotions;

  // mapear objetos a strings si vienen como {label,name,emotion}
  emociones = emociones
    .map(x => (typeof x === 'string' ? x : (x?.label || x?.name || x?.emotion || null)))
    .filter(Boolean);

  // intensidad: normalizar a Number|null desde varias rutas
  const intensidadRaw = raw.intensidad ?? raw.intensity ?? raw.suggested?.intensity ?? raw.suggested?.intensidad
    ?? raw.analysis?.intensity ?? raw.analysis?.intensidad ?? raw.int ?? null;
  const intensidad = intensidadRaw === null || intensidadRaw === undefined ? null : Number(intensidadRaw);

  // nota
  const nota = raw.nota ?? raw.note ?? raw.suggested?.note ?? raw.suggested?.nota ?? null;

  // devolver copia no destructiva con campos garantizados
  return Object.assign({}, raw, { emociones, intensidad, nota });
}

/**
 * GET /api/registros?month=YYYY-MM
 * - Intenta parsear JSON
 */
export async function fetchEntriesByMonth(month, token) {
  const DEFAULT_TIMEOUT_MS = 10000;

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
      console.debug('fetchEntriesByMonth - bodyText (trunc):', typeof bodyText === 'string' ? bodyText.slice(0, 20000) : bodyText);
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
      if (Array.isArray(parsed)) {
        return parsed.map(normalizeEntryForAnalysis);
      }
      if (parsed && Array.isArray(parsed.registros)) return parsed.registros.map(normalizeEntryForAnalysis);
      if (parsed && Array.isArray(parsed.entries)) return parsed.entries.map(normalizeEntryForAnalysis);
      return [];
    }

    // --- Normalizar y devolver siempre array de registros con campos esperados ---
    let resultArray = [];
    if (Array.isArray(parsed)) resultArray = parsed;
    else if (parsed && Array.isArray(parsed.registros)) resultArray = parsed.registros;
    else if (parsed && Array.isArray(parsed.entries)) resultArray = parsed.entries;
    else if (parsed && parsed.data && Array.isArray(parsed.data.registros)) resultArray = parsed.data.registros;
    else if (parsed && parsed.data && Array.isArray(parsed.data.entries)) resultArray = parsed.data.entries;
    else resultArray = [];

    // Normalizar cada entrada para que el resto del flujo reciba la forma esperada
    const normalizedEntries = resultArray.map(normalizeEntryForAnalysis);

    // Log de depuración (muestra solo 3 para no saturar)
    try {
      console.debug('fetchEntriesByMonth - normalized sample:', normalizedEntries.slice(0,3).map(e => ({ id: e._id || e.id, fecha: e.fecha || e.date, emocionesCount: (e.emociones||[]).length, intensidad: e.intensidad })));
    } catch (e) { /* ignore */ }

    return normalizedEntries;
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
          return parsedCache.map(normalizeEntryForAnalysis);
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
  const parsed = await parseJsonSafe(res);
  // Normalizar la entrada individual antes de devolver
  if (parsed && typeof parsed === 'object') {
    return normalizeEntryForAnalysis(parsed);
  }
  return parsed;
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
  const parsed = await parseJsonSafe(res);
  // Normalizar la entrada creada si viene como objeto
  if (parsed && typeof parsed === 'object') {
    return normalizeEntryForAnalysis(parsed);
  }
  return parsed;
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
  const parsed = await parseJsonSafe(res);
  if (parsed && typeof parsed === 'object') {
    return normalizeEntryForAnalysis(parsed);
  }
  return parsed;
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
  const parsed = await parseJsonSafe(res);
  // Si devuelve array de registros, normalizarlos
  if (Array.isArray(parsed)) return parsed.map(normalizeEntryForAnalysis);
  if (parsed && Array.isArray(parsed.registros)) return parsed.registros.map(normalizeEntryForAnalysis);
  return parsed;
}
