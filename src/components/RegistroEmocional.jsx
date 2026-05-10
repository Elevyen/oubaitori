import { useEffect, useMemo, useRef, useState } from 'react';
import '../styles/modal.css';
import {
    formatDate,
    isWithinLast7Days,
    todayDate
} from '../utils/date';

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
    { id: 'tristeza', label: 'Tristeza', emoji: '😔', tipo: 'mala', color: '#5FAAA0', textColor: '#0b2a2a' },
    { id: 'ansiedad', label: 'Ansiedad', emoji: '😰️', tipo: 'mala', color: '#90CAF9', textColor: '#0b2a2a' },
    { id: 'ira', label: 'Ira', emoji: '😠', tipo: 'mala', color: '#E64A19', textColor: '#000000' },
    { id: 'miedo', label: 'Miedo', emoji: '😨', tipo: 'mala', color: '#0B6FAF', textColor: '#ffffff' },
    { id: 'soledad', label: 'Soledad', emoji: '🏝️', tipo: 'mala', color: '#D7EAF5', textColor: '#0b2a2a' },
    { id: 'bienestar', label: 'Bienestar', emoji: '💫', tipo: 'buena', color: '#E1F5FE', textColor: '#0b2a2a' }
];

function base64ToArrayBuffer(base64) {
    const binary = atob(base64);
    const len = binary.length;
    const bytes = new Uint8Array(len);

    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes.buffer;
}

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';

    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
}

async function importAesKeyFromBase64(base64Key) {
    const raw = base64ToArrayBuffer(base64Key);

    return crypto.subtle.importKey(
        'raw',
        raw,
        'AES-GCM',
        false,
        ['encrypt', 'decrypt']
    );
}

async function encryptAesGcmBase64BackendFormat(
    plainText,
    base64Key
) {
    if (!plainText) return null;

    const key = await importAesKeyFromBase64(base64Key);

    const iv = crypto.getRandomValues(
        new Uint8Array(12)
    );

    const enc = new TextEncoder();

    const data = enc.encode(String(plainText));

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    );

    const cipherBytes = new Uint8Array(cipherBuffer);

    const tagLen = 16;

    const ciphertext = cipherBytes.slice(
        0,
        cipherBytes.length - tagLen
    );

    const tag = cipherBytes.slice(
        cipherBytes.length - tagLen
    );

    const combined = new Uint8Array(
        iv.byteLength +
        tag.byteLength +
        ciphertext.byteLength
    );

    combined.set(iv, 0);
    combined.set(tag, iv.byteLength);
    combined.set(
        ciphertext,
        iv.byteLength + tag.byteLength
    );

    return arrayBufferToBase64(combined.buffer);
}

function ensureIdsAreStrings(obj) {
    if (!obj || typeof obj !== 'object') return obj;

    const copy = { ...obj };

    if (copy._id !== undefined) {
        copy._id = String(copy._id);
    }

    if (copy.id !== undefined) {
        copy.id = String(copy.id);
    }

    if (copy.userId !== undefined) {
        copy.userId = String(copy.userId);
    }

    return copy;
}

async function defaultGuardarRegistro(
    payload,
    { token, apiBase = '' } = {}
) {
    const safePayload = ensureIdsAreStrings(payload);

    const isUpdate =
        !!safePayload.id ||
        !!safePayload._id;

    if (!isUpdate) {
        const res = await fetch(
            `${apiBase}/api/registros`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(safePayload)
            }
        );

        const json = await res.json();

        if (!res.ok) {
            throw new Error(
                json.message || 'Error guardando'
            );
        }

        return json.registro;
    }

    const idToUse =
        safePayload.id || safePayload._id;

    const res = await fetch(
        `${apiBase}/api/registros/${idToUse}`,
        {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(safePayload)
        }
    );

    const json = await res.json();

    if (!res.ok) {
        throw new Error(
            json.message || 'Error actualizando'
        );
    }

    return json.registro;
}

export default function RegistroEmocional({
    open,
    onClose,
    onSave,
    date,
    initial = {},
    apiBase = '',
    notaKeyBase64
}) {

    const [selectedEmotions, setSelectedEmotions] =
        useState([]);

    const [intensity, setIntensity] =
        useState(5);

    const [tagsText, setTagsText] =
        useState('');

    const [nota, setNota] =
        useState('');

    const [filter, setFilter] =
        useState('');

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState('');

    const initializedRef =
        useRef(false);

    const token =
        sessionStorage.getItem('authToken') ||
        localStorage.getItem('userToken');

    const usuario =
        JSON.parse(
            localStorage.getItem('userData') || 'null'
        );

    const resolveUserId = (u) => {
        if (!u) return null;

        return String(
            u._id ||
            u.id ||
            u.userId ||
            ''
        );
    };

    const normalizeEmotion = (e) => {
        if (!e) return null;

        if (typeof e === 'string') {
            return (
                EMOTIONS.find(x => x.id === e) ||
                null
            );
        }

        if (e.id) {
            const found =
                EMOTIONS.find(
                    x => x.id === e.id
                );

            if (found) return found;
        }

        return null;
    };

    useEffect(() => {
        if (!open) {
            initializedRef.current = false;
            return;
        }

        if (initializedRef.current) {
            return;
        }

        initializedRef.current = true;

        const emociones =
            (
                initial.emociones || []
            )
                .map(normalizeEmotion)
                .filter(Boolean);

        setSelectedEmotions(emociones);

        setIntensity(
            initial.intensidad ?? 5
        );

        setTagsText(
            Array.isArray(initial.etiquetas)
                ? initial.etiquetas.join(', ')
                : ''
        );

        setNota(initial.nota || '');

        setError('');

    }, [open, initial]);

    const isEditingToday = useMemo(() => {

        if (!initial) return false;

        const fecha =
            initial.fecha || initial.date;

        if (!fecha) return false;

        return (
            formatDate(fecha) ===
            formatDate(todayDate())
        );

    }, [initial]);

    const visiblePresets = EMOTIONS.filter(
        e =>
            e.label
                .toLowerCase()
                .includes(
                    filter.toLowerCase()
                )
    );

    const togglePreset = (emotion) => {

        const exists =
            selectedEmotions.find(
                s => s.id === emotion.id
            );

        if (exists) {

            setSelectedEmotions(prev =>
                prev.filter(
                    s => s.id !== emotion.id
                )
            );

            return;
        }

        setSelectedEmotions(prev => [
            ...prev,
            emotion
        ]);
    };

    async function submit() {

        setSaving(true);
        setError('');

        try {

            const resolvedUserId =
                resolveUserId(usuario);

            if (!resolvedUserId) {
                throw new Error(
                    'Usuario no autenticado'
                );
            }

            const fechaPayload =
                typeof date === 'string'
                    ? date
                    : formatDate(date);

            const todayKey =
                formatDate(todayDate());

            const selectedDateKey =
                formatDate(fechaPayload);

            const isToday =
                selectedDateKey === todayKey;

            const hasExistingRecord =
                !!initial &&
                !!(
                    initial.id ||
                    initial._id
                );

            if (
                !isWithinLast7Days(
                    selectedDateKey
                )
            ) {

                setError(
                    'Solo puedes registrar emociones de los últimos 7 días.'
                );

                setSaving(false);

                return;
            }

            if (
                !isToday &&
                hasExistingRecord
            ) {

                setError(
                    'Los días anteriores solo pueden registrarse una vez.'
                );

                setSaving(false);

                return;
            }

            let notaEncrypted = null;

            if (
                nota &&
                nota.trim()
            ) {

                notaEncrypted =
                    await encryptAesGcmBase64BackendFormat(
                        nota,
                        notaKeyBase64
                    );
            }

            const payload = {
                fecha: fechaPayload,
                userId: resolvedUserId,
                emociones:
                    selectedEmotions.map(e => ({
                        id: e.id,
                        label: e.label,
                        emoji: e.emoji,
                        tipo: e.tipo,
                        color: e.color,
                        textColor: e.textColor
                    })),
                intensidad: Number(intensity),
                etiquetas: tagsText
                    .split(',')
                    .map(t => t.trim())
                    .filter(Boolean),
                notaEncrypted,
                version:
                    initial.version || 1
            };

            if (
                isToday &&
                hasExistingRecord
            ) {

                payload.id =
                    initial.id ||
                    initial._id;

                payload._id =
                    initial.id ||
                    initial._id;
            }

            const saved =
                await defaultGuardarRegistro(
                    payload,
                    {
                        token,
                        apiBase
                    }
                );

            if (onSave) {
                onSave(saved);
            }

            onClose();

        } catch (err) {

            console.error(err);

            setError(
                err.message ||
                'Error guardando'
            );

        } finally {

            setSaving(false);
        }
    }

    if (!open) return null;

    return (
        <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
        >

            <div className="modal-card">

                <header className="modal-header">

                    <h3>
                        {
                            isEditingToday
                                ? 'Editar registro de hoy'
                                : 'Registrar emoción'
                        }
                    </h3>

                    <div className="modal-date">
                        {formatDate(date)}
                    </div>

                </header>

                <div className="modal-body">

                    <div className="selected-bar">

                        {
                            selectedEmotions.length === 0
                                ? (
                                    <div className="selected-placeholder">
                                        No hay emociones seleccionadas
                                    </div>
                                )
                                : (
                                    selectedEmotions.map(s => (
                                        <div
                                            key={s.id}
                                            className="selected-chip"
                                            style={{
                                                background: s.color,
                                                color: s.textColor
                                            }}
                                        >

                                            <span>
                                                {s.emoji}
                                            </span>

                                            <span>
                                                {s.label}
                                            </span>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedEmotions(
                                                        prev =>
                                                            prev.filter(
                                                                x => x.id !== s.id
                                                            )
                                                    );
                                                }}
                                            >
                                                ×
                                            </button>

                                        </div>
                                    ))
                                )
                        }

                    </div>

                    <div className="field">

                        <div className="field-label">
                            Buscar emoción
                        </div>

                        <input
                            value={filter}
                            onChange={e =>
                                setFilter(
                                    e.target.value
                                )
                            }
                            placeholder="Filtrar emociones..."
                        />

                    </div>

                    <div className="presets">

                        {
                            visiblePresets.map(e => {

                                const selected =
                                    selectedEmotions.find(
                                        s => s.id === e.id
                                    );

                                return (
                                    <button
                                        key={e.id}
                                        type="button"
                                        className={`preset-btn ${
                                            selected
                                                ? 'preset-selected'
                                                : ''
                                        }`}
                                        onClick={() =>
                                            togglePreset(e)
                                        }
                                        title={e.label}
                                        style={{
                                            '--preset-bg': e.color,
                                            '--preset-fg': e.textColor
                                        }}
                                    >
                                        {e.emoji}
                                    </button>
                                );
                            })
                        }

                    </div>

                    <label className="field">

                        <div className="field-label">
                            Intensidad
                        </div>

                        <input
                            type="range"
                            min="0"
                            max="10"
                            value={intensity}
                            onChange={e =>
                                setIntensity(
                                    Number(
                                        e.target.value
                                    )
                                )
                            }
                        />

                        <div className="range-value">
                            {intensity}/10
                        </div>

                    </label>

                    <label className="field">

                        <div className="field-label">
                            Etiquetas
                        </div>

                        <input
                            value={tagsText}
                            onChange={e =>
                                setTagsText(
                                    e.target.value
                                )
                            }
                            placeholder="ansiedad, calma..."
                        />

                    </label>

                    <label className="field">

                        <div className="field-label">
                            Nota
                        </div>

                        <textarea
                            value={nota}
                            onChange={e =>
                                setNota(
                                    e.target.value
                                )
                            }
                            maxLength={2000}
                        />

                    </label>

                </div>

                {
                    error && (
                        <div
                            className="error"
                            style={{
                                padding: 12,
                                color: '#8b0000'
                            }}
                        >
                            {error}
                        </div>
                    )
                }

                <footer className="modal-footer">

                    <button
                        className="btn-secondary"
                        onClick={onClose}
                        disabled={saving}
                    >
                        Cancelar
                    </button>

                    <button
                        className="btn-primary"
                        onClick={submit}
                        disabled={saving}
                    >
                        {
                            saving
                                ? 'Guardando...'
                                : (
                                    isEditingToday
                                        ? 'Actualizar'
                                        : 'Guardar'
                                )
                        }
                    </button>

                </footer>

            </div>

        </div>
    );
}