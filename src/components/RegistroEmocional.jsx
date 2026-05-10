import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/modal.css';
import { formatDate, isWithinLast7Days, todayDate } from '../utils/date';

const EMOTIONS = [
    { id: 'alegria', label: 'Alegría', emoji: '😊', tipo: 'buena', color: '#F2D94E', textColor: '#111111' },
    { id: 'amor', label: 'Amor', emoji: '❤️', tipo: 'buena', color: '#FF9FB3', textColor: '#111111' },
    { id: 'gratitud', label: 'Gratitud', emoji: '🙏', tipo: 'buena', color: '#FFDDB3', textColor: '#111111' },
    { id: 'esperanza', label: 'Esperanza', emoji: '🌟', tipo: 'buena', color: '#FFF59D', textColor: '#111111' },
    { id: 'serenidad', label: 'Serenidad', emoji: '🌿', tipo: 'buena', color: '#A8D5BA', textColor: '#0b2a2a' },
    { id: 'calma', label: 'Calma', emoji: '🧘', tipo: 'buena', color: '#B2DFDB', textColor: '#0b2a2a' },
    { id: 'tranquilidad', label: 'Tranquilidad', emoji: '🌊', tipo: 'buena', color: '#B3CDD1', textColor: '#0b2a2a' },
    { id: 'entusiasmo', label: 'Entusiasmo', emoji: '🔥', tipo: 'buena', color: '#FFB74D', textColor: '#111111' },
    { id: 'euforia', label: 'Euforia', emoji: '🤗', tipo: 'buena', color: '#FFD180', textColor: '#111111' },
    { id: 'plenitud', label: 'Plenitud', emoji: '🕊️', tipo: 'buena', color: '#E8F5E9', textColor: '#0b2a2a' },
    { id: 'dicha', label: 'Dicha', emoji: '😄', tipo: 'buena', color: '#FFF59D', textColor: '#111111' },
    { id: 'regocijo', label: 'Regocijo', emoji: '🎉', tipo: 'buena', color: '#FFDAB9', textColor: '#111111' },
    { id: 'deleite', label: 'Deleite', emoji: '😋', tipo: 'buena', color: '#FFE0B2', textColor: '#111111' },
    { id: 'satisfaccion', label: 'Satisfacción', emoji: '🥳', tipo: 'buena', color: '#FFF3E0', textColor: '#111111' },
    { id: 'orgullo', label: 'Orgullo', emoji: '💪', tipo: 'buena', color: '#FFE082', textColor: '#111111' },
    { id: 'motivacion', label: 'Motivación', emoji: '🚀', tipo: 'buena', color: '#FFECB3', textColor: '#111111' },
    { id: 'admiracion', label: 'Admiración', emoji: '✨', tipo: 'buena', color: '#EFCFF6', textColor: '#111111' },
    { id: 'ternura', label: 'Ternura', emoji: '🥰', tipo: 'buena', color: '#FFDDE6', textColor: '#111111' },
    { id: 'empatia', label: 'Empatía', emoji: '🤗️', tipo: 'buena', color: '#FFE0B2', textColor: '#111111' },
    { id: 'compasion', label: 'Compasión', emoji: '🫂', tipo: 'buena', color: '#FFEBEE', textColor: '#111111' },
    { id: 'curiosidad', label: 'Curiosidad', emoji: '🤔', tipo: 'neutra', color: '#CFEAFB', textColor: '#0b2a2a' },
    { id: 'interes', label: 'Interés', emoji: '🔎', tipo: 'neutra', color: '#BEE9FF', textColor: '#0b2a2a' },
    { id: 'fascinacion', label: 'Fascinación', emoji: '🤩️', tipo: 'buena', color: '#FFF3E0', textColor: '#111111' },
    { id: 'anticipacion', label: 'Anticipación', emoji: '⏳', tipo: 'neutra', color: '#E69F00', textColor: '#111111' },
    { id: 'expectativa', label: 'Expectativa', emoji: '🔮', tipo: 'neutra', color: '#FFE6A7', textColor: '#111111' },
    { id: 'sorpresa', label: 'Sorpresa', emoji: '😲', tipo: 'neutra', color: '#7EC8F2', textColor: '#111111' },
    { id: 'asombro', label: 'Asombro', emoji: '😮', tipo: 'neutra', color: '#9FD9F0', textColor: '#111111' },
    { id: 'desconcierto', label: 'Desconcierto', emoji: '🤯', tipo: 'neutra', color: '#B3E5FC', textColor: '#0b2a2a' },
    { id: 'estupefaccion', label: 'Estupefacción', emoji: '😶‍🌫️', tipo: 'neutra', color: '#E0F7FA', textColor: '#0b2a2a' },
    { id: 'incredulidad', label: 'Incredulidad', emoji: '🤨️', tipo: 'neutra', color: '#FFF9C4', textColor: '#111111' },
    { id: 'tristeza', label: 'Tristeza', emoji: '😔', tipo: 'mala', color: '#5FAAA0', textColor: '#0b2a2a' },
    { id: 'pena', label: 'Pena', emoji: '😢', tipo: 'mala', color: '#8FBBD6', textColor: '#0b2a2a' },
    { id: 'melancolia', label: 'Melancolía', emoji: '😞', tipo: 'mala', color: '#B0B8C1', textColor: '#111111' },
    { id: 'nostalgia', label: 'Nostalgia', emoji: '🕰️', tipo: 'neutra', color: '#D7CCC8', textColor: '#111111' },
    { id: 'duelo', label: 'Duelo', emoji: '😿', tipo: 'mala', color: '#8F9EA6', textColor: '#111111' },
    { id: 'desolacion', label: 'Desolación', emoji: '🕳️', tipo: 'mala', color: '#BDBDBD', textColor: '#111111' },
    { id: 'desamparo', label: 'Desamparo', emoji: '🥀', tipo: 'mala', color: '#E0C1C1', textColor: '#111111' },
    { id: 'abatimiento', label: 'Abatimiento', emoji: '😩', tipo: 'mala', color: '#CFC0C0', textColor: '#111111' },
    { id: 'ira', label: 'Ira', emoji: '😠', tipo: 'mala', color: '#E64A19', textColor: '#000000' },
    { id: 'enfado', label: 'Enfado', emoji: '😤', tipo: 'mala', color: '#FFB08A', textColor: '#111111' },
    { id: 'irritacion', label: 'Irritación', emoji: '😒', tipo: 'mala', color: '#CFC6C0', textColor: '#111111' },
    { id: 'frustracion', label: 'Frustración', emoji: '😖', tipo: 'mala', color: '#F4C7B8', textColor: '#111111' },
    { id: 'indignacion', label: 'Indignación', emoji: '🗯️', tipo: 'mala', color: '#FFCCBC', textColor: '#111111' },
    { id: 'rencor', label: 'Rencor', emoji: '🗡️', tipo: 'mala', color: '#D7A9A9', textColor: '#111111' },
    { id: 'hostilidad', label: 'Hostilidad', emoji: '⚔️', tipo: 'mala', color: '#E57373', textColor: '#111111' },
    { id: 'furia', label: 'Furia', emoji: '😡', tipo: 'mala', color: '#A61B1B', textColor: '#ffffff' },
    { id: 'fastidio', label: 'Fastidio', emoji: '😬', tipo: 'mala', color: '#E0E0E0', textColor: '#111111' },
    { id: 'aversion', label: 'Aversión', emoji: '🤢', tipo: 'mala', color: '#D55E00', textColor: '#000000' },
    { id: 'repulsion', label: 'Repulsión', emoji: '🤮', tipo: 'mala', color: '#A64B00', textColor: '#ffffff' },
    { id: 'asco', label: 'Asco', emoji: '🤢', tipo: 'mala', color: '#D55E00', textColor: '#000000' },
    { id: 'envidia', label: 'Envidia', emoji: '🐍', tipo: 'mala', color: '#C8E6C9', textColor: '#0b2a2a' },
    { id: 'celos', label: 'Celos', emoji: '🫣', tipo: 'mala', color: '#FFE0E6', textColor: '#111111' },
    { id: 'traicion', label: 'Traición', emoji: '🫥', tipo: 'mala', color: '#BCAAA4', textColor: '#111111' },
    { id: 'desprecio', label: 'Desprecio', emoji: '🙄', tipo: 'mala', color: '#D7CCC8', textColor: '#111111' },
    { id: 'miedo', label: 'Miedo', emoji: '😨', tipo: 'mala', color: '#0B6FAF', textColor: '#ffffff' },
    { id: 'temor', label: 'Temor', emoji: '😰', tipo: 'mala', color: '#6B9AC4', textColor: '#000000' },
    { id: 'ansiedad', label: 'Ansiedad', emoji: '😰️', tipo: 'mala', color: '#90CAF9', textColor: '#0b2a2a' },
    { id: 'angustia', label: 'Angustia', emoji: '😩️', tipo: 'mala', color: '#B39DDB', textColor: '#111111' },
    { id: 'panico', label: 'Pánico', emoji: '😵', tipo: 'mala', color: '#90A4AE', textColor: '#111111' },
    { id: 'pavor', label: 'Pavor', emoji: '😧', tipo: 'mala', color: '#90A4AE', textColor: '#111111' },
    { id: 'inseguridad', label: 'Inseguridad', emoji: '🥺', tipo: 'mala', color: '#F8BBD0', textColor: '#111111' },
    { id: 'vulnerabilidad', label: 'Vulnerabilidad', emoji: '🫤', tipo: 'mala', color: '#FFE6EE', textColor: '#111111' },
    { id: 'desconfianza', label: 'Desconfianza', emoji: '🤨', tipo: 'mala', color: '#E6EE9C', textColor: '#111111' },
    { id: 'confusion', label: 'Confusión', emoji: '😕', tipo: 'neutra', color: '#F0F4C3', textColor: '#111111' },
    { id: 'apatia', label: 'Apatía', emoji: '😶', tipo: 'mala', color: '#ECEFF1', textColor: '#111111' },
    { id: 'aburrimiento', label: 'Aburrimiento', emoji: '😑', tipo: 'neutra', color: '#D3D3D3', textColor: '#111111' },
    { id: 'tedio', label: 'Tedio', emoji: '😐', tipo: 'neutra', color: '#E0E0E0', textColor: '#111111' },
    { id: 'remordimiento', label: 'Remordimiento', emoji: '😣', tipo: 'mala', color: '#D1BFB6', textColor: '#111111' },
    { id: 'culpa', label: 'Culpa', emoji: '😟', tipo: 'mala', color: '#C9BDB3', textColor: '#111111' },
    { id: 'soledad', label: 'Soledad', emoji: '🏝️', tipo: 'mala', color: '#D7EAF5', textColor: '#0b2a2a' },
    { id: 'resiliencia', label: 'Resiliencia', emoji: '🌱', tipo: 'buena', color: '#C8E6C9', textColor: '#0b2a2a' },
    { id: 'bienestar', label: 'Bienestar', emoji: '💫', tipo: 'buena', color: '#E1F5FE', textColor: '#0b2a2a' },
    { id: 'cansancio', label: 'Cansancio', emoji: '😴', tipo: 'neutra', color: '#D7CCC8', textColor: '#111111' },
    { id: 'fatiga', label: 'Fatiga', emoji: '🪫', tipo: 'neutra', color: '#BCAAA4', textColor: '#111111' },
    { id: 'vigor', label: 'Vigor', emoji: '⚡', tipo: 'buena', color: '#FFD54F', textColor: '#111111' },
    { id: 'tension', label: 'Tensión', emoji: '💢', tipo: 'mala', color: '#FFAB91', textColor: '#111111' },
    { id: 'palpitaciones', label: 'Palpitaciones', emoji: '🫀', tipo: 'mala', color: '#FFCDD2', textColor: '#111111' },
    { id: 'desvelo', label: 'Desvelo', emoji: '🌙', tipo: 'neutra', color: '#CFD8DC', textColor: '#111111' },
    { id: 'relajacion', label: 'Relajación', emoji: '🛀', tipo: 'buena', color: '#E0F2F1', textColor: '#0b2a2a' },
    { id: 'ligereza', label: 'Ligereza', emoji: '✨️', tipo: 'buena', color: '#FFF8E1', textColor: '#111111' },
    { id: 'hormigueo', label: 'Hormigueo', emoji: '🫢', tipo: 'neutra', color: '#FFE0B2', textColor: '#111111' }
];

// Encriptado helpers
function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}
function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}
async function importAesKeyFromBase64(base64Key) {
    const raw = base64ToArrayBuffer(base64Key);
    if (!(raw && raw.byteLength === 32)) {
        throw new Error('invalid_key_length');
    }
    return await crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function encryptAesGcmBase64BackendFormat(plainText, base64Key) {
    if (!plainText) return null;
    const key = await importAesKeyFromBase64(base64Key);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const data = enc.encode(String(plainText));
    const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
    const cipherBytes = new Uint8Array(cipherBuffer);
    const tagLen = 16;
    if (cipherBytes.length < tagLen) throw new Error('cipher_too_short');
    const ciphertext = cipherBytes.slice(0, cipherBytes.length - tagLen);
    const tag = cipherBytes.slice(cipherBytes.length - tagLen);
    const combined = new Uint8Array(iv.byteLength + tag.byteLength + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(tag, iv.byteLength);
    combined.set(ciphertext, iv.byteLength + tag.byteLength);
    return arrayBufferToBase64(combined.buffer);
}

// Asegura que ID es string (no elimina campos)
function ensureIdsAreStrings(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    const copy = { ...obj };
    if (copy._id !== undefined) {
        try {
            copy._id = copy._id && typeof copy._id.toString === 'function' ? String(copy._id.toString()) : String(copy._id || '');
        } catch {
            copy._id = String(copy._id || '');
        }
    }
    if (copy.id !== undefined) copy.id = String(copy.id || '');
    if (copy.userId !== undefined) copy.userId = String(copy.userId || '');
    return copy;
}
function generateClientId() {
    try {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    } catch (e) { }
    return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// defaultGuardarRegistro (mejorada: sanitiza, logs y detección explícita de id)
async function defaultGuardarRegistro(payload, { token, apiBase = '' } = {}) {
    if (!token) {
        const err = new Error('Usuario no autenticado');
        err.code = 'Usuario no autenticado';
        throw err;
    }

    // Normalizar ids a strings
    const safePayload = ensureIdsAreStrings(payload || {});

    // Eliminar id/_id/userId vacíos (evita falsy confusos)
    if (safePayload.id !== undefined) {
        safePayload.id = String(safePayload.id || '').trim();
        if (safePayload.id === '') delete safePayload.id;
    }
    if (safePayload._id !== undefined) {
        safePayload._id = String(safePayload._id || '').trim();
        if (safePayload._id === '') delete safePayload._id;
    }
    if (safePayload.userId !== undefined) {
        safePayload.userId = String(safePayload.userId || '').trim();
        if (safePayload.userId === '') delete safePayload.userId;
    }

    const safeJson = async (res) => {
        try { return await res.json(); } catch { return null; }
    };

    const handleErrorResponse = async (res) => {
        const text = await res.text().catch(() => null);
        console.error('Server response text:', text);
        let json = null;
        try { json = text ? JSON.parse(text) : null; } catch { json = null; }
        const err = new Error((json && json.message) || text || 'Error guardando');
        err.code = (json && json.error) || (res.status === 404 ? 'No encontrado' : 'Error guardando');
        throw err;
    };

    const hasId = typeof safePayload.id !== 'undefined' && safePayload.id !== null;
    const hasUnderscoreId = typeof safePayload._id !== 'undefined' && safePayload._id !== null;

    // Crear (POST) si no hay id definido explícitamente
    if (!hasId && !hasUnderscoreId) {
        console.debug('defaultGuardarRegistro POST payload:', safePayload);
        const res = await fetch(`${apiBase}/api/registros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(safePayload)
        });
        if (!res.ok) {
            await handleErrorResponse(res);
        }
        const json = await safeJson(res) || {};
        return json.registro || json;
    }

    // Actualizar (PUT) si hay id
    const idToUse = safePayload.id || safePayload._id;
    let resPut;
    try {
        console.debug('defaultGuardarRegistro PUT payload:', safePayload, 'idToUse:', idToUse);
        resPut = await fetch(`${apiBase}/api/registros/${encodeURIComponent(idToUse)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(safePayload)
        });
    } catch (networkErr) {
        console.warn('PUT network error, intentando POST de fallback', networkErr);
        const createPayload = { ...safePayload };
        delete createPayload.id;
        delete createPayload._id;
        const resPost = await fetch(`${apiBase}/api/registros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(createPayload)
        });
        if (!resPost.ok) {
            await handleErrorResponse(resPost);
        }
        const jsonPost = await safeJson(resPost) || {};
        return jsonPost.registro || jsonPost;
    }

    if (resPut.ok) {
        const json = await safeJson(resPut) || {};
        return json.registro || json;
    }

    if (resPut.status === 404) {
        const createPayload = { ...safePayload };
        delete createPayload.id;
        delete createPayload._id;
        console.debug('PUT devolvió 404, creando con payload:', createPayload);
        const resPost = await fetch(`${apiBase}/api/registros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(createPayload)
        });
        if (!resPost.ok) {
            await handleErrorResponse(resPost);
        }
        const jsonPost = await safeJson(resPost) || {};
        return jsonPost.registro || jsonPost;
    }

    await handleErrorResponse(resPut);
}

// Sincronizar pendientes
async function defaultSincronizar({ token, apiBase = '' } = {}) {
    if (!token) {
        const err = new Error('Usuario no autenticado');
        err.code = 'Usuario no autenticado';
        throw err;
    }
    let pendientes = [];
    try {
        const raw = localStorage.getItem('pendingRegistros');
        pendientes = raw ? JSON.parse(raw) : [];
    } catch {
        pendientes = [];
    }
    if (!Array.isArray(pendientes) || pendientes.length === 0) {
        return { ok: true, actualizados: [], rechazados: [] };
    }

    const safePendientes = (pendientes || []).map(ensureIdsAreStrings);

    const res = await fetch(`${apiBase}/api/registros/sincronizar`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items: safePendientes })
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
        const err = new Error(json.message || 'Error al sincronizar');
        err.code = json.error || 'Error al sincronizar';
        throw err;
    }
    if (json.actualizados && json.actualizados.length > 0) {
        localStorage.removeItem('pendingRegistros');
    }
    return json;
}

// Cache helpers
function clearLocalRecordCacheForDateOrId({ id, fecha }) {
    try {
        const raw = localStorage.getItem('pendingRegistros');
        const pendientes = raw ? JSON.parse(raw) : [];
        const nuevos = pendientes.filter(p => String(p.id || p._id) !== String(id) && formatDate(p.fecha) !== formatDate(fecha));
        localStorage.setItem('pendingRegistros', JSON.stringify(nuevos));
    } catch (e) {
        console.warn('clearLocalRecordCacheForDateOrId pending error', e);
    }

    try {
        Object.keys(localStorage).filter(k => /registro|registros|pending|entradas|entradasCache|analisis/i.test(k)).forEach(k => {
            try { localStorage.removeItem(k); } catch (e) { }
        });
    } catch (e) {
        console.warn('clearLocalRecordCacheForDateOrId localStorage error', e);
    }

    try { sessionStorage.clear(); } catch (e) { }
}

function hasExistingForDate(dateString, existingEntryProp) {
    const keyDate = formatDate(dateString);
    if (!keyDate) return false;
    if (existingEntryProp) return true;

    try {
        const rawPend = localStorage.getItem('pendingRegistros');
        const pendientes = rawPend ? JSON.parse(rawPend) : [];
        if (Array.isArray(pendientes) && pendientes.find(p => formatDate(p.fecha) === keyDate)) return true;
    } catch (e) { }

    try {
        const rawCache = localStorage.getItem('entradasCache_v1');
        const cache = rawCache ? JSON.parse(rawCache) : [];
        if (Array.isArray(cache) && cache.find(r => formatDate(r.fecha) === keyDate)) return true;
    } catch (e) { }

    return false;
}

export default function RegistroEmocional({
    open,
    onClose,
    date,
    onSave,
    initial = {},
    usuarioActual: usuarioProp,
    token: tokenProp,
    guardarRegistro: guardarRegistroProp,
    sincronizarConServidor: sincronizarProp,
    apiBase = '',
    existingEntry = false,
    notaKeyBase64
}) {
    const normalizeEmotion = (e) => {
        if (!e) return null;

        if (typeof e === "string") {
            const found = EMOTIONS.find(x => x.id === e);
            return found ? { ...found } : null;
        }
        // Si ya tiene id
        if (e.id) {
            const found = EMOTIONS.find(x => x.id === e.id);
            if (found) {
                return { ...found };
            }
            return {
                id: String(e.id).trim(),
                label: String(e.label || e.id).trim(),
                emoji: e.emoji || '',
                tipo: e.tipo || 'neutra',
                color: e.color || '',
                textColor: e.textColor || ''
            };
        }
        return null;
    };

    const [emoji, setEmoji] = useState(initial.emoji || '');
    const [intensity, setIntensity] = useState(initial.intensity ?? 5);
    const [tagsText, setTagsText] = useState((initial.tags || initial.etiquetas || []).join(', '));
    const [nota, setNota] = useState(initial?.nota || '');
    useEffect(() => {
        setNota(initial?.nota);
    }, [initial]);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('');
    const [selectedEmotions, setSelectedEmotions] = useState(
        (initial.selectedEmotions || initial.emociones || []).map(normalizeEmotion).filter(Boolean)
    );
    const [error, setError] = useState('');
    const prevOpenRef = useRef(false);

    const [loadedRegistroId, setLoadedRegistroId] = useState(null);
    const [loadingRegistro, setLoadingRegistro] = useState(false);

    const resolveUserId = (u) => {
        if (!u) return null;
        return String(u._id || u.id || u.userId || u._userId || '');
    };

    const usuario = usuarioProp || (() => {
        try {
            const raw = localStorage.getItem('userData');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    })();

    const token = tokenProp || (() => {
        return sessionStorage.getItem('authToken') || localStorage.getItem('userToken') || null;
    })();

    const guardarRegistro = guardarRegistroProp || ((payload, opts = {}) => defaultGuardarRegistro(payload, { token: opts.token || token, apiBase: apiBase || '' }));
    const sincronizarConServidor = sincronizarProp || ((opts = {}) => defaultSincronizar({ token: opts.token || token, apiBase: apiBase || '' }));

    const parseTags = (text) => (text || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    const joinTags = (arr) => Array.from(new Set(arr)).join(', ');

    const addTagIdToText = (id) => {
        const parts = parseTags(tagsText);
        if (!parts.includes(id.toLowerCase())) {
            parts.push(id.toLowerCase());
            setTagsText(joinTags(parts));
        }
    };

    const removeTagIdFromText = (id) => {
        const parts = parseTags(tagsText).filter(t => t !== id.toLowerCase());
        setTagsText(joinTags(parts));
    };

    const resetForm = (useInitial = false) => {
        if (useInitial && initial && Object.keys(initial).length > 0) {
            setEmoji(initial.emoji || '');
            setIntensity(initial.intensity ?? 5);
            setTagsText((initial.tags || initial.etiquetas || []).join(', '));
            setNota(initial.nota || '');
            const normalized = (initial.selectedEmotions || initial.emociones || []).map(normalizeEmotion).filter(Boolean);
            setSelectedEmotions(normalized);
        } else {
            setEmoji('');
            setIntensity(5);
            setTagsText('');
            setNota('');
            setSelectedEmotions([]);
        }
        setError('');
    };

    useEffect(() => {
        const tags = parseTags(tagsText).map(t => t.toLowerCase());

        setSelectedEmotions(prev => {
            if (prev.length > 0) return prev;

            const fromTags = EMOTIONS.filter(e => tags.includes(e.id.toLowerCase()));

            if (fromTags.length > 0) {
                if (!fromTags.find(e => e.emoji === emoji)) setEmoji('');
                return fromTags;
            }

            return prev;
        });
    }, [tagsText]);

    const isEditingToday = useMemo(() => {
        try {
            if (!initial || !(initial.id || initial._id)) return false;
            const initialFecha = initial.fecha || initial.date || null;
            if (!initialFecha) return false;
            const todayKey = todayDate();
            return formatDate(initialFecha) === todayKey;
        } catch {
            return false;
        }
    }, [initial?.id, initial?.fecha]);

    useEffect(() => {
        if (!open) return;
        const idToLoad = initial && (initial.id || initial._id) ? (initial.id || initial._id) : null;
        if (!idToLoad) return;
        const sameDate = formatDate(initial?.fecha) === formatDate(date)
        if (
            loadedRegistroId === idToLoad &&
            sameDate
        ) {
            return;
        }

        let cancelled = false;
        async function loadRegistro() {
            setLoadingRegistro(true);
            try {
                const resp = await fetch(`${apiBase}/api/registros/${encodeURIComponent(idToLoad)}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                });
                if (!resp.ok) {
                    setLoadingRegistro(false);
                    return;
                }
                const body = await resp.json().catch(() => null);
                if (!body || !body.ok || !body.registro) {
                    setLoadingRegistro(false);
                    return;
                }
                if (cancelled) return;

                const registro = body.registro;
                setLoadedRegistroId(idToLoad);

                if (registro.nota !== undefined && registro.nota !== null) {
                    setNota(registro.nota || '');
                } else {
                    setNota('');
                }

                if (registro.etiquetas && Array.isArray(registro.etiquetas)) {
                    const normalized = registro.etiquetas
                        .map(tag => EMOTIONS.find(e => e.id === tag))
                        .filter(Boolean);

                    setSelectedEmotions(normalized);
                }

                if (typeof registro.intensidad !== 'undefined' && registro.intensidad !== null) {
                    setIntensity(registro.intensidad);
                }

                if (registro.etiquetas && Array.isArray(registro.etiquetas)) {
                    setTagsText((registro.etiquetas || []).join(', '));
                }
            } catch (err) {
                console.error('Error cargando registro remoto:', err);
            } finally {
                if (!cancelled) setLoadingRegistro(false);
            }
        }

        loadRegistro();
        return () => { cancelled = true; };
    }, [
        open,
        date,
        initial?.id,
        initial?._id,
        apiBase,
        token
    ]);
    useEffect(() => {
        if (!open) return;

        setLoadedRegistroId(null);
        setError('');

        if (!initial || Object.keys(initial).length === 0) {
            resetForm(false);
        }
    }, [date, open]);

    async function loadRegistroByDate(fechaDD) {
        // LIMPIAR ESTADO ANTES DE CARGAR
        setLoadedRegistroId(null);
        setNota('');
        setSelectedEmotions([]);
        setIntensity(5);
        setTagsText('');

        if (!fechaDD) return null;

        setLoadingRegistro(true);
        try {
            const resp = await fetch(`${apiBase}/api/registros/fecha/${encodeURIComponent(fechaDD)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                }
            });
            if (!resp.ok) {
                setLoadingRegistro(false);
                return null;
            }
            const body = await resp.json().catch(() => null);
            if (!body || !body.ok || !body.registro) {
                setLoadingRegistro(false);
                return null;
            }
            const registro = body.registro;
            // asigna estado con todo el registro (nota ya desencriptada por backend si eres owner)
            setLoadedRegistroId(registro.id || registro._id || null);
            setNota(registro.nota || '');
            if (registro.etiquetas && Array.isArray(registro.etiquetas)) {
                const normalized = registro.etiquetas
                    .map(tag => EMOTIONS.find(e => e.id === tag))
                    .filter(Boolean);

                setSelectedEmotions(normalized);
            }
            if (typeof registro.intensidad !== 'undefined' && registro.intensidad !== null) {
                setIntensity(registro.intensidad);
            }
            if (registro.etiquetas && Array.isArray(registro.etiquetas)) {
                setTagsText((registro.etiquetas || []).join(', '));
            }
            return registro;
        } catch (err) {
            console.error('Error cargando registro por fecha:', err);
            return null;
        } finally {
            setLoadingRegistro(false);
        }
    }

    useEffect(() => {
        if (open && !prevOpenRef.current) {
            if (initial && Object.keys(initial).length > 0) {
                setEmoji(initial.emoji || '');
                setIntensity(initial.intensity ?? 5);
                setTagsText((initial.tags || initial.etiquetas || []).join(', '));
                setNota(initial.nota || '');
                const normalized = (initial.selectedEmotions || initial.emociones || []).map(normalizeEmotion).filter(Boolean);
                setSelectedEmotions(normalized);
                setError('');
            } else {
                // Si no hay initial pero puede existir registro para la fecha, intenta cargarlo
                (async () => {
                    const fechaKey = typeof date === 'string' ? date : formatDate(date);
                    const existing = hasExistingForDate(fechaKey, existingEntry);
                    if (existing) {
                        // intentr recuperar registro por fecha y rellenar modal
                        const reg = await loadRegistroByDate(fechaKey);
                        if (!reg) resetForm(false);
                    } else {
                        resetForm(false);
                    }
                })();
            }
        }

        if (!open && prevOpenRef.current) {

            setLoadedRegistroId(null);

            if (!isEditingToday) {
                resetForm(false);
            }
        }
        prevOpenRef.current = open;
    }, [open, initial?.id, isEditingToday]);

    const togglePreset = (e) => {
        const exists = selectedEmotions.find(s => s.id === e.id);
        if (exists) {
            setSelectedEmotions(prev => prev.filter(s => s.id !== e.id));
            removeTagIdFromText(e.id);
            if (emoji === e.emoji) setEmoji('');
        } else {
            setSelectedEmotions(prev => [...prev, { id: e.id, label: e.label, emoji: e.emoji, tipo: e.tipo, color: e.color, textColor: e.textColor }]);
            addTagIdToText(e.id);
            if (!emoji) setEmoji(e.emoji);
        }
    };

    const removeSelectedEmotion = (id) => {
        setSelectedEmotions(prev => {
            const removed = prev.find(s => s.id === id);
            const next = prev.filter(s => s.id !== id);
            if (removed && emoji === removed.emoji) setEmoji('');
            removeTagIdFromText(id);
            return next;
        });
    };

    const handlePresetKey = (ev, preset) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            togglePreset(preset);
        }
    };

    const handleTagsKey = (ev) => {
        if (ev.key === 'Enter') {
            ev.preventDefault();
            const parts = parseTags(tagsText);
            setTagsText(joinTags(parts));
        }
    };

    const handleTagsBlur = () => {
        const parts = parseTags(tagsText);
        setTagsText(joinTags(parts));
    };

    // Encriptar nota en cliente usando notaKeyBase64
    async function encryptNotaOrThrow(plain) {
        if (!plain) return null;
        if (typeof notaKeyBase64 !== 'string' || !notaKeyBase64.trim()) {
            throw new Error('encrypt_not_configured');
        }
        try {
            return await encryptAesGcmBase64BackendFormat(String(plain), notaKeyBase64);
        } catch (e) {
            console.error('encryptAesGcmBase64BackendFormat failed', e);
            if (e.message === 'invalid_key_length') throw new Error('encrypt_invalid_key');
            throw new Error('encrypt_failed');
        }
    }

    async function submit() {
        setSaving(true);
        setError('');
        try {
            const resolvedUserId = resolveUserId(usuario);
            if (!resolvedUserId) {
                const err = new Error('Usuario no autenticado');
                err.code = 'Usuario no autenticado';
                throw err;
            }
            if (!token) {
                const err = new Error('Token ausente');
                err.code = 'no_token';
                throw err;
            }

            const fechaPayload = typeof date === 'string' ? date : formatDate(date);

            const within7Days = isWithinLast7Days(fechaPayload);
            const alreadyExists = hasExistingForDate(fechaPayload, existingEntry);
            if (!isEditingToday && alreadyExists && within7Days) {
                setError('Ya existe un registro para esa fecha. Solo se permite 1 registro por día.');
                setSaving(false);
                return;
            }

            const intensidadNum = Number(intensity);

            const emociones = selectedEmotions
                .map(normalizeEmotion)
                .filter(Boolean)
                .map(e => ({
                    id: String(e.id),
                    label: String(e.label || ''),
                    emoji: e.emoji || '',
                    tipo: e.tipo || 'neutra',
                    color: e.color || '',
                    textColor: e.textColor || ''
                }));

            // Construcción de carga base
            const carga = {
                fecha: fechaPayload,
                emociones,
                intensidad: intensidadNum,
                etiquetas: tagsText ? tagsText.split(',').map(t => t.trim()).filter(Boolean) : [],
                version: initial && initial.version ? initial.version : 1
            };

            // Añadir userId explícito (normalizado)
            carga.userId = String(resolvedUserId);

            // Si venimos de edición, forzar registroId desde initial
            if (isEditingToday && initial && (initial.id || initial._id)) {
                const registroId = String(
                    initial.id || initial._id || ''
                ).trim();

                if (registroId) {
                    carga.id = registroId;
                    carga._id = registroId;
                }
            }

            // Encriptar nota en cliente y añadir notaEncrypted
            let notaEncryptedToSend = null;
            if ((nota || '').trim().length > 0) {
                try {
                    notaEncryptedToSend = await encryptNotaOrThrow(nota);
                } catch (encErr) {
                    console.error('encryptNota failed:', encErr);
                    const err = new Error(encErr.message === 'encrypt_not_configured' ? 'No hay método de encriptación configurado.' : 'No se pudo encriptar la nota. Intenta de nuevo más tarde.');
                    err.code = encErr.message === 'encrypt_not_configured' ? 'encrypt_not_configured' : (encErr.message === 'encrypt_invalid_key' ? 'encrypt_invalid_key' : 'encrypt_failed');
                    throw err;
                }
                carga.notaEncrypted = notaEncryptedToSend;
            } else {
                if (initial && (initial.id || initial._id)) {
                    carga.notaEncrypted = null;
                }
            }

            // Normalizar y sanitizar IDs antes de enviar
            const safeCarga = ensureIdsAreStrings(carga);

            // Eliminar id/_id/userId vacíos (evita enviar cadenas vacías)
            if (safeCarga.id !== undefined) {
                safeCarga.id = String(safeCarga.id || '').trim();
                if (safeCarga.id === '') delete safeCarga.id;
            }
            if (safeCarga._id !== undefined) {
                safeCarga._id = String(safeCarga._id || '').trim();
                if (safeCarga._id === '') delete safeCarga._id;
            }
            if (safeCarga.userId !== undefined) {
                safeCarga.userId = String(safeCarga.userId || '').trim();
                if (safeCarga.userId === '') delete safeCarga.userId;
            }

            // Logs para depuración (muestra lo esencial, evita exponer nota en claro)
            try {
                console.debug('RegistroEmocional submit payload (final):', {
                    fecha: safeCarga.fecha,
                    id: safeCarga.id,
                    userIdPresent: !!safeCarga.userId,
                    notaEncryptedPresent: !!safeCarga.notaEncrypted,
                    emocionesCount: Array.isArray(safeCarga.emociones) ? safeCarga.emociones.length : 0
                });
            } catch (e) { }
            // DEBUG TEMPORAL: inspeccionar payload final que se va a enviar
            console.debug('DEBUG submit - payload final (pre-send):', {
                fecha: safeCarga.fecha,
                id: safeCarga.id,
                userId: safeCarga.userId,
                notaEncryptedPresent: Object.prototype.hasOwnProperty.call(safeCarga, 'notaEncrypted'),
                notaEncryptedIsNull: safeCarga.notaEncrypted === null,
                emocionesCount: Array.isArray(safeCarga.emociones)
                    ? safeCarga.emociones.length
                    : 0
            });

            let guardado;
            try {
                guardado = await guardarRegistro(safeCarga, { token });
            } catch (errSave) {
                // Si backend devuelve 409 con detalle y isToday true, reintentar PUT
                if ((errSave && errSave.code === 'Límite día') || (errSave && errSave.message && errSave.message.toLowerCase().includes('ya existe'))) {
                    // fallback: llamar a la API para obtener registro por fecha y usar su id
                    try {
                        const fechaPayload = formatDate(date);
                        const resp = await fetch(`${apiBase}/api/registros/fecha/${fechaPayload}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (resp.ok) {
                            const body = await resp.json();
                            const existingId = body?.registro?.id;
                            if (existingId) {
                                safeCarga.id = existingId;
                                safeCarga._id = existingId;
                                guardado = await guardarRegistro(safeCarga, { token });
                            }
                        }
                    } catch (e) {
                        // seguir con el error original
                    }
                }
                if (!guardado) throw errSave;
            }

            if (navigator.onLine) {
                try {
                    await sincronizarConServidor({ token, userId: resolvedUserId });
                } catch (err) {
                    console.warn('sincronización inmediata fallida', err);
                }
            } else {
                try {
                    const raw = localStorage.getItem('pendingRegistros');
                    const pendientes = raw ? JSON.parse(raw) : [];

                    const pending = { ...safeCarga };
                    pending.fecha = formatDate(pending.fecha);
                    if (!pending.id) pending.id = generateClientId();
                    // Si notaEncrypted es undefined, no incluirla para evitar sobrescribir en servidor
                    if (typeof pending.notaEncrypted === 'undefined') delete pending.notaEncrypted;
                    pendientes.push(pending);
                    localStorage.setItem('pendingRegistros', JSON.stringify(pendientes));
                } catch (e) {
                    console.warn('No se pudo guardar pendiente localmente', e);
                }
            }

            if (typeof onSave === 'function') onSave(guardado);

            if (!isEditingToday) {
                resetForm(false);
            }
            onClose();
        } catch (err) {
            console.error('error guardando registro', err);
            if (err && (err.code === 'No encontrado' || String(err.message).toLowerCase().includes('no encontrado') || String(err.message).toLowerCase().includes('not found'))) {
                try {
                    clearLocalRecordCacheForDateOrId({ id: initial && (initial.id || initial._id), fecha: formatDate(date) });
                } catch (e) { }
            }

            if (err && err.code === 'limite_dia_alcanzado') {
                setError('Sólo se permite 1 registro por día.');
            } else if (err && err.code === 'No encontrado') {
                setError('No se encontró el registro a editar. Intenta recargar la página.');
            } else if (err && err.code === 'error_actualizando') {
                setError('No se pudo actualizar el registro. Intenta de nuevo más tarde.');
            } else if (err && (err.code === 'Usuario no autenticado' || err.code === 'no_token' || err.code === 'no_autorizado')) {
                setError('Usuario no autenticado. Inicia sesión e inténtalo de nuevo.');
            } else if (err && err.code === 'encrypt_failed') {
                setError('No se pudo encriptar la nota. Intenta de nuevo más tarde.');
            } else if (err && err.code === 'encrypt_not_configured') {
                setError('No hay método de encriptación configurado. Contacta con la app.');
            } else if (err && err.code === 'encrypt_invalid_key') {
                setError('Clave de encriptación inválida. Contacta con la app.');
            } else {
                setError(err.message || 'No se pudo guardar el registro.');
            }
        } finally {
            setSaving(false);
        }
    }

    if (!open) return null;

    const visiblePresets = EMOTIONS.filter(e =>
        e.label.toLowerCase().includes(filter.trim().toLowerCase())
    );

    const formattedDate = formatDate(date);

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Formulario de emoción">
            <div className="modal-card">
                <header className="modal-header">
                    <h3>{isEditingToday ? 'Editar registro de hoy' : 'Registrar emoción'}</h3>
                    <div className="modal-date">{formattedDate}</div>
                </header>

                <div className="modal-body">
                    <div className="selected-bar" aria-hidden={selectedEmotions.length === 0}>
                        {selectedEmotions.length === 0 ? (
                            <div className="selected-placeholder">No hay emociones seleccionadas</div>
                        ) : (
                            selectedEmotions.map(s => (
                                <div key={s.id} className="selected-chip" title={s.label} style={{ background: s.color || '#eee', color: s.textColor || '#111' }}>
                                    <span className="chip-emoji" role="img" aria-label={s.label} style={{ marginRight: 6 }}>
                                        {s.emoji}
                                    </span>
                                    <span className="chip-label">{s.label}</span>
                                    <button
                                        type="button"
                                        className="chip-remove small"
                                        onClick={() => removeSelectedEmotion(s.id)}
                                        onKeyDown={(ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); removeSelectedEmotion(s.id); } }}
                                        aria-label={`Quitar ${s.label}`}
                                        title={`Quitar ${s.label}`}>×</button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="field">
                        <div className="field-label">Buscar emoción</div>
                        <input
                            autoFocus
                            value={filter}
                            onChange={e => setFilter(e.target.value)}
                            placeholder="Filtrar emociones..."
                            aria-label="Buscar emoción"
                        />
                    </div>

                    <div className="field">
                        <div className="field-label">Elegir emoción (pasa por encima para ver nombre) — haz click para añadir a etiquetas</div>
                        <div className="presets" style={{ maxHeight: 200, overflowY: 'auto' }}>
                            {visiblePresets.map(e => {
                                const isSelected = !!selectedEmotions.find(s => s.id === e.id);
                                return (
                                    <button
                                        key={e.id}
                                        type="button"
                                        className={`preset-btn ${isSelected ? 'preset-selected' : ''}`}
                                        onClick={() => togglePreset(e)}
                                        onKeyDown={(ev) => handlePresetKey(ev, e)}
                                        title={e.label}
                                        aria-pressed={isSelected}
                                        aria-label={`${isSelected ? 'Quitar' : 'Añadir'} ${e.label} a tags`}
                                        style={{
                                            '--preset-bg': e.color,
                                            '--preset-fg': e.textColor
                                        }}
                                    >
                                        <span role="img" aria-label={e.label} className="preset-emoji">
                                            {e.emoji}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="hint" style={{ marginTop: 8, fontSize: 12, color: '#666' }}>
                            Haz click en un icono para añadir la emoción a las etiquetas; también puedes escribir etiquetas manualmente.
                        </div>
                    </div>

                    <label className="field">
                        <div className="field-label">Intensidad</div>
                        <input
                            type="range"
                            min="0"
                            max="10"
                            value={intensity}
                            onChange={e => setIntensity(Number(e.target.value))}
                            aria-label="Intensidad"
                        />
                        <div className="range-value">{intensity}/10</div>
                    </label>

                    <label className="field">
                        <div className="field-label">Etiquetas</div>
                        <input
                            value={tagsText}
                            onChange={e => setTagsText(e.target.value)}
                            onKeyDown={handleTagsKey}
                            onBlur={handleTagsBlur}
                            placeholder="separa con comas (p. ej. ansiedad, optimismo, amor)"
                            aria-label="Etiquetas"
                        />
                        <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                            Las etiquetas pueden ser texto libre o las emociones de los iconos.
                        </div>
                    </label>

                    <label className="field">
                        <div className="field-label">Nota</div>
                        <textarea
                            value={nota}
                            onChange={e => setNota(e.target.value)}
                            maxLength={2000}
                            placeholder="Escribe aquí... (máx 2000 caracteres)"
                            aria-label="Nota"
                        />
                        <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                            La nota se encriptará, tus datos están seguros.
                        </div>
                    </label>
                </div>

                {error && <div className="error" role="alert" style={{ padding: 12, color: '#8b0000' }}>{error}</div>}

                <footer className="modal-footer">
                    <button className="btn-secondary" onClick={() => {
                        if (!isEditingToday) resetForm(false);
                        onClose();
                    }} disabled={saving}>Cancelar</button>
                    <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? 'Guardando...' : (isEditingToday ? 'Actualizar' : 'Guardar')}</button>
                </footer>
            </div>
        </div>
    );
}
