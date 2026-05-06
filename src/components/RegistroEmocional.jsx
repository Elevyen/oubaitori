import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/modal.css';

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


/* ----------------- utilidades de fecha y hashing ----------------- */
function formatDateYYYYMMDD(d) {
    if (!d) return '';
    let dt;
    if (typeof d === 'string') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
        const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${m[1]}-${m[2]}-${m[3]}`;
        dt = new Date(d);
    } else {
        dt = d;
    }
    if (!(dt instanceof Date) || isNaN(dt)) return String(d);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatDateDDMMYYYY(d) {
    if (!d) return '';
    if (typeof d === 'string') {
        if (/^\d{2}-\d{2}-\d{4}$/.test(d)) return d;
        const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
        const parsed = new Date(d);
        if (!isNaN(parsed)) {
            const dd = String(parsed.getDate()).padStart(2, '0');
            const mm = String(parsed.getMonth() + 1).padStart(2, '0');
            const yyyy = parsed.getFullYear();
            return `${dd}-${mm}-${yyyy}`;
        }
        return d;
    }
    if (d instanceof Date && !isNaN(d)) {
        const dd = String(d.getDate()).padStart(2, '0');
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${dd}-${mm}-${yyyy}`;
    }
    return String(d);
}

function bufferToHex(buffer) {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sha256Hex(text) {
    if (!text) return '';
    const enc = new TextEncoder();
    const data = enc.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return bufferToHex(hashBuffer);
}

function ensureIdsAreStrings(obj) {
    if (!obj || typeof obj !== "object") return obj;
    const copy = { ...obj };
    if (copy._id !== undefined) {
        try {
            copy._id = copy._id && typeof copy._id.toString === "function" ? String(copy._id.toString()) : String(copy._id || "");
        } catch {
            copy._id = String(copy._id || "");
        }
    }
    if (copy.id !== undefined) copy.id = String(copy.id || "");
    if (copy.usuarioId !== undefined) copy.usuarioId = String(copy.usuarioId || "");
    if (copy.userId !== undefined) copy.userId = String(copy.userId || "");
    return copy;
}

async function defaultGuardarRegistro(payload, { token, apiBase = '' } = {}) {
    if (!token) {
        const err = new Error('Usuario no autenticado');
        err.code = 'no_autenticado';
        throw err;
    }

    const safePayload = ensureIdsAreStrings(payload || {});

    const safeJson = async (res) => {
        try {
            return await res.json();
        } catch {
            return null;
        }
    };

    // POST si no hay id
    if (!safePayload.id && !safePayload._id) {
        const res = await fetch(`${apiBase}/api/registros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(safePayload)
        });
        const json = await safeJson(res) || {};
        if (!res.ok) {
            const err = new Error(json.message || 'error_guardando');
            err.code = json.error || (res.status === 404 ? 'no_encontrado' : 'error_guardando');
            throw err;
        }
        return json.registro || json;
    }

    // PUT si hay id
    const idToUse = safePayload.id || safePayload._id;
    let resPut;
    try {
        resPut = await fetch(`${apiBase}/api/registros/${encodeURIComponent(idToUse)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(safePayload)
        });
    } catch (networkErr) {
        // fallback a POST en error de red
        const createPayload = { ...safePayload };
        delete createPayload.id;
        delete createPayload._id;
        const resPost = await fetch(`${apiBase}/api/registros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(createPayload)
        });
        const jsonPost = await safeJson(resPost) || {};
        if (!resPost.ok) {
            const err = new Error(jsonPost.message || 'error_guardando');
            err.code = jsonPost.error || 'error_guardando';
            throw err;
        }
        return jsonPost.registro || jsonPost;
    }

    // PUT ok
    if (resPut.ok) {
        const json = await safeJson(resPut) || {};
        return json.registro || json;
    }

    // PUT 404 -> mapear y reintentar POST
    if (resPut.status === 404) {
        const createPayload = { ...safePayload };
        delete createPayload.id;
        delete createPayload._id;
        const resPost = await fetch(`${apiBase}/api/registros`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(createPayload)
        });
        const jsonPost = await safeJson(resPost) || {};
        if (!resPost.ok) {
            const err = new Error(jsonPost.message || 'error_guardando');
            err.code = jsonPost.error || 'error_guardando';
            throw err;
        }
        return jsonPost.registro || jsonPost;
    }

    // Otros errores del PUT: parsear y propagar
    const jsonPut = await safeJson(resPut) || {};
    const err = new Error(jsonPut.message || 'error_actualizando');
    err.code = jsonPut.error || 'error_actualizando';
    throw err;
}

/* ----------------- sincronización por defecto (cliente) ----------------- */
async function defaultSincronizar({ token, apiBase = '' } = {}) {
    if (!token) {
        const err = new Error('Usuario no autenticado');
        err.code = 'no_autenticado';
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
        const err = new Error(json.message || 'error_sincronizar');
        err.code = json.error || 'error_sincronizar';
        throw err;
    }
    if (json.actualizados && json.actualizados.length > 0) {
        localStorage.removeItem('pendingRegistros');
    }
    return json;
}

/* ----------------- utilidades de cache local y comprobaciones ----------------- */
function clearLocalRecordCacheForDateOrId({ id, fecha }) {
    try {
        // limpiar pendingRegistros por id o fecha
        const raw = localStorage.getItem('pendingRegistros');
        const pendientes = raw ? JSON.parse(raw) : [];
        const nuevos = pendientes.filter(p => String(p.id || p._id) !== String(id) && formatDateYYYYMMDD(p.fecha) !== formatDateYYYYMMDD(fecha));
        localStorage.setItem('pendingRegistros', JSON.stringify(nuevos));
    } catch (e) {
        console.warn('clearLocalRecordCacheForDateOrId pending error', e);
    }

    try {
        // eliminar claves relacionadas por patrón (ej. entradasCache_v1)
        Object.keys(localStorage).filter(k => /registro|registros|pending|entradas|entradasCache|analisis/i.test(k)).forEach(k => {
            try { localStorage.removeItem(k); } catch (e) { /* ignore */ }
        });
    } catch (e) {
        console.warn('clearLocalRecordCacheForDateOrId localStorage error', e);
    }

    try { sessionStorage.clear(); } catch (e) { /* ignore */ }
}

// Comprueba si ya existe un registro para la fecha en: prop existingEntry, pendingRegistros o entradasCache_v1
function hasExistingForDate(dateString, existingEntryProp) {
    const keyDate = formatDateYYYYMMDD(dateString);
    if (!keyDate) return false;
    if (existingEntryProp) return true;

    try {
        const rawPend = localStorage.getItem('pendingRegistros');
        const pendientes = rawPend ? JSON.parse(rawPend) : [];
        if (Array.isArray(pendientes) && pendientes.find(p => formatDateYYYYMMDD(p.fecha) === keyDate)) return true;
    } catch (e) { /* ignore */ }

    try {
        const rawCache = localStorage.getItem('entradasCache_v1');
        const cache = rawCache ? JSON.parse(rawCache) : [];
        if (Array.isArray(cache) && cache.find(r => formatDateYYYYMMDD(r.fecha) === keyDate)) return true;
    } catch (e) { /* ignore */ }

    return false;
}

/* ----------------- componente RegistroEmocional ----------------- */
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
    existingEntry = false
}) {
    const normalizeEmotion = (e) => {
        if (!e) return null;
        const ref = EMOTIONS.find(x => x.id === e.id);
        if (ref) return { ...ref };
        return {
            id: e.id,
            label: e.label || '',
            emoji: e.emoji || '',
            tipo: e.tipo || null,
            color: e.color || '',
            textColor: e.textColor || ''
        };
    };

    const [emoji, setEmoji] = useState(initial.emoji || '');
    const [intensity, setIntensity] = useState(initial.intensity ?? 5);
    const [tagsText, setTagsText] = useState((initial.tags || initial.etiquetas || []).join(', '));
    const [note, setNote] = useState(initial?.nota ?? initial?.note ?? initial?.noteText ?? "");
    useEffect(() => {
        setNote(initial?.nota ?? initial?.note ?? initial?.noteText ?? "");
    }, [initial]);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('');
    const [selectedEmotions, setSelectedEmotions] = useState(
        (initial.selectedEmotions || initial.emociones || []).map(normalizeEmotion).filter(Boolean)
    );
    const [error, setError] = useState('');
    const prevOpenRef = useRef(false);

    // Nuevo: trackear si ya cargamos el registro remoto para evitar refetch innecesario
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
            setNote(initial.note || '');
            const normalized = (initial.selectedEmotions || initial.emociones || []).map(normalizeEmotion).filter(Boolean);
            setSelectedEmotions(normalized);
        } else {
            setEmoji('');
            setIntensity(5);
            setTagsText('');
            setNote('');
            setSelectedEmotions([]);
        }
        setError('');
    };

    useEffect(() => {
        const tags = parseTags(tagsText).map(t => t.toLowerCase());
        setSelectedEmotions(prev => {
            const fromTags = EMOTIONS.filter(e => tags.includes(e.id.toLowerCase()));
            if (fromTags.length > 0) {
                if (!fromTags.find(e => e.emoji === emoji)) setEmoji('');
                return fromTags;
            }
            const filtered = prev.filter(e => tags.includes(e.id.toLowerCase())).map(e => normalizeEmotion(e));
            if (!filtered.find(e => e.emoji === emoji)) setEmoji('');
            return filtered;
        });
    }, [tagsText]);

    const isEditingToday = useMemo(() => {
        try {
            if (!initial || !initial.id) return false;
            const initialFecha = initial.fecha || initial.date || null;
            if (!initialFecha) return false;
            const todayKey = new Date().toLocaleDateString('sv-SE');
            return formatDateYYYYMMDD(initialFecha) === todayKey;
        } catch {
            return false;
        }
    }, [initial?.id, initial?.fecha]);

    // Nuevo: cargar registro remoto (desencriptado por backend) cuando abrimos modal para editar
    useEffect(() => {
        if (!open) return;
        const idToLoad = initial && (initial.id || initial._id) ? (initial.id || initial._id) : null;
        if (!idToLoad) return;

        // evitar recargar si ya cargamos este id
        if (loadedRegistroId === idToLoad) return;

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
                    // no forzar error visual; solo log
                    console.debug('GET registro failed', resp.status);
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
                // backend devuelve registro.nota (texto plano) para el propietario
                // Rellenar campos solo si no hay interacción del usuario (evitar sobrescribir si ya escribió)
                setLoadedRegistroId(idToLoad);

                // Preferir valores del registro remoto si existen
                if (registro.nota !== undefined && registro.nota !== null) {
                    setNote(registro.nota || '');
                } else if (registro.notaEncrypted && !note) {
                    // si backend devolviera ciphertext (no recomendado), no desencriptamos en cliente
                    setNote('');
                }

                if (registro.emociones && Array.isArray(registro.emociones)) {
                    const normalized = registro.emociones.map(normalizeEmotion).filter(Boolean);
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
    }, [open, initial && (initial.id || initial._id), apiBase, token]);

    useEffect(() => {
        if (open && !prevOpenRef.current) {
            if (initial && Object.keys(initial).length > 0) {
                setEmoji(initial.emoji || '');
                setIntensity(initial.intensity ?? 5);
                setTagsText((initial.tags || initial.etiquetas || []).join(', '));
                setNote(initial.note || '');
                const normalized = (initial.selectedEmotions || initial.emociones || []).map(normalizeEmotion).filter(Boolean);
                setSelectedEmotions(normalized);
                setError('');
            } else {
                resetForm(false);
            }
        }

        if (!open && prevOpenRef.current) {
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

    // Comprueba si la fecha está dentro de los últimos N días (incluye hoy si N>=0)
    function isWithinLastNDays(dateString, n) {
        try {
            const target = new Date(formatDateYYYYMMDD(dateString));
            if (isNaN(target)) return false;
            const today = new Date();
            // normalizar horas
            target.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.floor((today - target) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= n;
        } catch {
            return false;
        }
    }

    async function submit() {
        setSaving(true);
        setError('');
        try {
            const resolvedUserId = resolveUserId(usuario);
            if (!resolvedUserId) {
                const err = new Error('Usuario no autenticado');
                err.code = 'no_autenticado';
                throw err;
            }
            if (!token) {
                const err = new Error('Token ausente');
                err.code = 'no_token';
                throw err;
            }

            const fechaPayload = formatDateYYYYMMDD(date);

            // Bloqueo: si no estamos editando y ya existe registro para esa fecha (comprobación extendida)
            // además aplicamos la restricción para los últimos 6 días
            const within6Days = isWithinLastNDays(fechaPayload, 6);
            const alreadyExists = hasExistingForDate(fechaPayload, existingEntry);
            if (!(initial && initial.id) && alreadyExists && within6Days) {
                setError('Ya existe un registro para esa fecha. Solo se permite 1 registro por día.');
                setSaving(false);
                return;
            }

            const notaHash = await sha256Hex(note || '');
            const intensidadNum = Number(intensity);

            const carga = {
                userId: resolvedUserId,
                fecha: fechaPayload,
                hora: new Date().toISOString(),
                emociones: selectedEmotions.map(e => ({
                    id: e.id,
                    label: e.label,
                    emoji: e.emoji,
                    tipo: e.tipo || null,
                    color: e.color,
                    textColor: e.textColor
                })),
                intensidad: intensidadNum,
                etiquetas: tagsText ? tagsText.split(',').map(t => t.trim()).filter(Boolean) : [],
                notaHash,
                nota: note || '',
                meta: { source: 'modal' }
            };

            if (initial && (initial.id || initial._id)) {
                carga.id = initial.id || initial._id;
                carga._id = initial._id || initial.id;
            }

            const safeCarga = ensureIdsAreStrings(carga);

            // Debug ligero
            try {
                console.debug('RegistroEmocional submit payload (sanitized):', { fecha: safeCarga.fecha, id: safeCarga.id, notaLength: (safeCarga.nota || '').length });
            } catch (e) { /* ignore */ }

            // Llamada a guardarRegistro (Dashboard decide PUT/POST)
            let guardado;
            try {
                guardado = await guardarRegistro(safeCarga, { token });
            } catch (errSave) {
                // Mapear mensajes comunes del backend a códigos manejables por la UI
                if (errSave && (errSave.message === 'not_found' || errSave.code === 'not_found' || errSave.status === 404)) {
                    const mapped = new Error('Registro no encontrado en servidor');
                    mapped.code = 'no_encontrado';
                    throw mapped;
                }
                throw errSave;
            }

            // Si estamos online, intentar sincronizar pendientes
            if (navigator.onLine) {
                try {
                    await sincronizarConServidor({ token, userId: resolvedUserId });
                } catch (err) {
                    console.warn('sincronización inmediata fallida', err);
                }
            } else {
                // Guardar pendiente localmente
                try {
                    const raw = localStorage.getItem('pendingRegistros');
                    const pendientes = raw ? JSON.parse(raw) : [];
                    const safePending = ensureIdsAreStrings(safeCarga);
                    pendientes.push(safePending);
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
            // Si el error indica que el recurso fue borrado en servidor, limpiar cache local para esa fecha/id
            if (err && (err.code === 'no_encontrado' || String(err.message).toLowerCase().includes('no encontrado') || String(err.message).toLowerCase().includes('not found'))) {
                try {
                    clearLocalRecordCacheForDateOrId({ id: initial && (initial.id || initial._id), fecha: formatDateYYYYMMDD(date) });
                } catch (e) { /* ignore */ }
            }

            // Mapear errores conocidos a mensajes de usuario
            if (err && err.code === 'limite_dia_alcanzado') {
                setError('Sólo se permite 1 registro por día.');
            } else if (err && err.code === 'no_encontrado') {
                setError('No se encontró el registro a editar. Intenta recargar la página.');
            } else if (err && err.code === 'error_actualizando') {
                setError('No se pudo actualizar el registro. Intenta de nuevo más tarde.');
            } else if (err && (err.code === 'no_autenticado' || err.code === 'no_token' || err.code === 'no_autorizado')) {
                setError('Usuario no autenticado. Inicia sesión e inténtalo de nuevo.');
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

    const formattedDate = formatDateDDMMYYYY(date);

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
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            maxLength={1000}
                            placeholder="Escribe aquí... (máx 1000 caracteres)"
                            aria-label="Nota"
                        />
                        <div style={{ marginTop: 6, fontSize: 12, color: '#666' }}>
                            La nota se enviará encriptada para proteger tu texto.
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
