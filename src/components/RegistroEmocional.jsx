import { useEffect, useRef, useState } from 'react';
import '../styles/modal.css';

const EMOTIONS = [
    { id: 'serenidad', label: 'Serenidad', emoji: '🌿', color: '#A8D5BA', textColor: '#0b2a2a' },
    { id: 'alegria', label: 'Alegría', emoji: '😊', color: '#F2D94E', textColor: '#111111' },
    { id: 'extasis', label: 'Éxtasis', emoji: '🤩', color: '#FFD28A', textColor: '#111111' },
    { id: 'confianza', label: 'Confianza', emoji: '🤝', color: '#2E8B57', textColor: '#000000' },
    { id: 'aprobacion', label: 'Aprobación', emoji: '👍', color: '#C6E8D0', textColor: '#0b2a2a' },
    { id: 'admiracion', label: 'Admiración', emoji: '✨', color: '#EFCFF6', textColor: '#111111' },
    { id: 'anticipacion', label: 'Anticipación', emoji: '⏳', color: '#E69F00', textColor: '#111111' },
    { id: 'vigilancia', label: 'Vigilancia', emoji: '👀', color: '#FFD27A', textColor: '#111111' },
    { id: 'expectativa', label: 'Expectativa', emoji: '🔮', color: '#FFE6A7', textColor: '#111111' },
    { id: 'temor', label: 'Temor', emoji: '😰', color: '#6B9AC4', textColor: '#000000' },
    { id: 'miedo', label: 'Miedo', emoji: '😨', color: '#0B6FAF', textColor: '#ffffff' },
    { id: 'terror', label: 'Terror', emoji: '😱', color: '#3F5F8A', textColor: '#ffffff' },
    { id: 'interes', label: 'Interés', emoji: '🔎', color: '#BEE9FF', textColor: '#0b2a2a' },
    { id: 'sorpresa', label: 'Sorpresa', emoji: '😲', color: '#7EC8F2', textColor: '#111111' },
    { id: 'asombro', label: 'Asombro', emoji: '😮', color: '#9FD9F0', textColor: '#111111' },
    { id: 'pena', label: 'Pena', emoji: '😢', color: '#8FBBD6', textColor: '#0b2a2a' },
    { id: 'tristeza', label: 'Tristeza', emoji: '😔', color: '#5FAAA0', textColor: '#0b2a2a' },
    { id: 'melancolia', label: 'Melancolía', emoji: '😞', color: '#B0B8C1', textColor: '#111111' },
    { id: 'duelo', label: 'Duelo', emoji: '😿', color: '#8F9EA6', textColor: '#111111' },
    { id: 'tedio', label: 'Tedio', emoji: '😐', color: '#E0E0E0', textColor: '#111111' },
    { id: 'aburrimiento', label: 'Aburrimiento', emoji: '😑', color: '#D3D3D3', textColor: '#111111' },
    { id: 'aversion', label: 'Aversión', emoji: '🤢', color: '#D55E00', textColor: '#000000' },
    { id: 'repulsion', label: 'Repulsión', emoji: '🤮', color: '#A64B00', textColor: '#ffffff' },
    { id: 'irritacion', label: 'Irritación', emoji: '😒', color: '#CFC6C0', textColor: '#111111' },
    { id: 'enfado', label: 'Enfado', emoji: '😤', color: '#FFB08A', textColor: '#111111' },
    { id: 'ira', label: 'Ira', emoji: '😠', color: '#E64A19', textColor: '#000000' },
    { id: 'furia', label: 'Furia', emoji: '😡', color: '#A61B1B', textColor: '#ffffff' },
    { id: 'amor', label: 'Amor', emoji: '❤️', color: '#FF9FB3', textColor: '#111111' },
    { id: 'gratitud', label: 'Gratitud', emoji: '🙏', color: '#FFDDB3', textColor: '#111111' },
    { id: 'ternura', label: 'Ternura', emoji: '🥰', color: '#FFDDE6', textColor: '#111111' },
    { id: 'orgullo', label: 'Orgullo', emoji: '💪', color: '#FFE082', textColor: '#111111' },
    { id: 'culpa', label: 'Culpa', emoji: '😟', color: '#C9BDB3', textColor: '#111111' },
    { id: 'remordimiento', label: 'Remordimiento', emoji: '😣', color: '#D1BFB6', textColor: '#111111' },
    { id: 'verguenza', label: 'Vergüenza', emoji: '😳', color: '#F48FB1', textColor: '#111111' },
    { id: 'desconfianza', label: 'Desconfianza', emoji: '🤨', color: '#E6EE9C', textColor: '#111111' },
    { id: 'desprecio', label: 'Desprecio', emoji: '🙄', color: '#D7CCC8', textColor: '#111111' },
    { id: 'traicion', label: 'Traición', emoji: '🫥', color: '#BCAAA4', textColor: '#111111' },
    { id: 'curiosidad', label: 'Curiosidad', emoji: '🤔', color: '#CFEAFB', textColor: '#0b2a2a' },
    { id: 'motivacion', label: 'Motivación', emoji: '🚀', color: '#FFECB3', textColor: '#111111' },
    { id: 'esperanza', label: 'Esperanza', emoji: '🌟', color: '#FFF59D', textColor: '#111111' },
    { id: 'alivio', label: 'Alivio', emoji: '😌', color: '#C8E6C9', textColor: '#0b2a2a' },
    { id: 'calma', label: 'Calma', emoji: '🧘', color: '#B2DFDB', textColor: '#0b2a2a' },
    { id: 'tranquilidad', label: 'Tranquilidad', emoji: '🌊', color: '#B3CDD1', textColor: '#0b2a2a' },
    { id: 'nostalgia', label: 'Nostalgia', emoji: '🕰️', color: '#D7CCC8', textColor: '#111111' },
    { id: 'frustracion', label: 'Frustración', emoji: '😖', color: '#F4C7B8', textColor: '#111111' },
    { id: 'euforia', label: 'Euforia', emoji: '🤗', color: '#FFD180', textColor: '#111111' }
];


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

export default function RegistroEmocional({ open, onClose, date, onSave, initial = {} }) {
    const [emoji, setEmoji] = useState(initial.emoji || '');
    const [intensity, setIntensity] = useState(initial.intensity ?? 5);
    const [tagsText, setTagsText] = useState((initial.tags || []).join(', '));
    const [note, setNote] = useState(initial.note || '');
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('');
    const [selectedEmotions, setSelectedEmotions] = useState(initial.selectedEmotions || []);

    const prevOpenRef = useRef(false);

    useEffect(() => {
        if (open && !prevOpenRef.current) {
            setEmoji(initial.emoji || '');
            setIntensity(initial.intensity ?? 5);
            setTagsText((initial.tags || []).join(', '));
            setNote(initial.note || '');
            setFilter('');
            setSelectedEmotions(initial.selectedEmotions || []);
        }
        prevOpenRef.current = open;
    }, [open]);

    const parseTags = (text) =>text .split(',').map(t => t.trim()).filter(Boolean);

    const joinTags = (arr) => Array.from(new Set(arr)).join(', ');

    const addTagIdToText = (id) => {
        const parts = parseTags(tagsText);
        if (!parts.includes(id)) {
            parts.push(id);
            setTagsText(joinTags(parts));
        }
    };

    const removeTagIdFromText = (id) => {
        const parts = parseTags(tagsText).filter(t => t !== id);
        setTagsText(joinTags(parts));
    };

    const togglePreset = (e) => {
        const exists = selectedEmotions.find(s => s.id === e.id);
        if (exists) {
            setSelectedEmotions(prev => prev.filter(s => s.id !== e.id));
            removeTagIdFromText(e.id);
            if (emoji === e.emoji) setEmoji('');
        } else {
            setSelectedEmotions(prev => [...prev, { id: e.id, label: e.label, emoji: e.emoji, color: e.color, textColor: e.textColor }]);
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

    const submit = async () => {
        if (selectedEmotions.length === 0 && !emoji) return alert('Selecciona al menos una emoción o añade una nota.');
        setSaving(true);

        const manualTags = parseTags(tagsText);
        const selectedIds = selectedEmotions.map(s => s.id);
        const merged = Array.from(new Set([...manualTags, ...selectedIds]));

        const payload = {
            date: formatDateDDMMYYYY(date),
            emotion: selectedEmotions[0]?.label || '',
            intensity: Number(intensity),
            tags: merged,
            note: String(note).slice(0, 1000),
            selectedEmotions,
            emoji: emoji || (selectedEmotions[0]?.emoji || '')
        };

        try {
            await onSave(payload);
            onClose();
        } catch (err) {
            console.error(err);
            alert('Error al guardar. Intenta de nuevo.');
        } finally {
            setSaving(false);
        }
    };
    //No renderizamos si no está abierto
    if (!open) return null;

    const visiblePresets = EMOTIONS.filter(e =>
        e.label.toLowerCase().includes(filter.trim().toLowerCase())
    );

    const formattedDate = formatDateDDMMYYYY(date);

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Formulario de emoción">
            <div className="modal-card">
                <header className="modal-header">
                    <h3>Registrar emoción</h3>
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
                            onChange={e => setIntensity(e.target.value)}
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
                    </label>
                </div>

                <footer className="modal-footer">
                    <button className="btn-secondary" onClick={onClose} disabled={saving}>Cancelar</button>
                    <button className="btn-primary" onClick={submit} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
                </footer>
            </div>
        </div>
    );
}
