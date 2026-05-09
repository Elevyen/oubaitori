// src/pages/PerfilUsuario.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import '../styles/usuario.css';

const API_BASE = (typeof import.meta !== "undefined" && import.meta.env && (import.meta.env.VITE_LOCAL_BACKEND || import.meta.env.VITE_RENDER_BACKEND )) || "";
function getToken() { try { return localStorage.getItem("tokenLogin") || ""; } catch { return ""; } }

/* Opciones locales fijas */
const LOCAL_GENEROS = ["mujer", "hombre", "nobinario", "prefiero no decirlo", "otro"];
const LOCAL_PRONOMBRES = ["él", "ella", "elle", "prefiero no decirlo"];

/* Inserta valores extra al principio sin duplicados */
function mergeList(baseList, extras) {
    const out = Array.isArray(baseList) ? [...baseList] : [];
    (Array.isArray(extras) ? extras : []).forEach(v => {
        if (v == null || v === "") return;
        const s = String(v);
        if (!out.includes(s)) out.unshift(s);
    });
    return out;
}

export default function PerfilUsuario() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [partners, setPartners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [newGusto, setNewGusto] = useState("");
    const [passwordState, setPasswordState] = useState({ current: "", nuevo: "", confirm: "" });
    const [pwLoading, setPwLoading] = useState(false);
    const [pwMessage, setPwMessage] = useState("");

    useEffect(() => { loadProfile(); loadPartners(); }, []);

    async function loadPartners() {
        try {
            const res = await fetch(`${API_BASE}/api/partners`, { headers: { Authorization: `Bearer ${getToken()}` } });
            if (!res.ok) return setPartners([]);
            const json = await res.json();
            setPartners(Array.isArray(json.partners) ? json.partners : []);
        } catch (err) {
            console.error("loadPartners:", err);
            setPartners([]);
        }
    }

    async function loadProfile() {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/api/usuarios/usuario`, { headers: { Authorization: `Bearer ${getToken()}` } });
            if (!res.ok) {
                if (res.status === 401) { localStorage.removeItem("tokenLogin"); navigate("/login"); return; }
                const b = await res.json().catch(() => ({}));
                throw new Error(b.error || "Error cargando perfil");
            }
            const data = await res.json();
            const u = data.usuario || data;
            setUser({
                _id: u._id || u.id,
                nombre: u.nombre || "",
                email: u.email || "",
                genero: u.genero || "",
                pronombres: u.pronombres || "",
                personaje: u.personaje || { id: "", nombre: "" },
                gustos: Array.isArray(u.gustos) ? u.gustos.slice() : []
            });
        } catch (err) {
            console.error("loadProfile:", err);
            setError("No se pudo cargar el perfil.");
        } finally {
            setLoading(false);
        }
    }

    function addGusto() {
        const g = (newGusto || "").trim();
        if (!g) return;
        if (!user.gustos.includes(g)) setUser(prev => ({ ...prev, gustos: [g, ...prev.gustos] }));
        setNewGusto("");
    }

    function removeGusto(g) {
        setUser(prev => ({ ...prev, gustos: prev.gustos.filter(x => x !== g) }));
    }

    function handleChange(field, value) {
        setUser(prev => ({ ...prev, [field]: value }));
    }

    async function saveProfile() {
        if (!user) return;
        setSaving(true);
        setError("");
        try {
            const payload = {
                nombre: user.nombre,
                email: user.email,
                personaje: user.personaje || {},
                gustos: user.gustos || [],
                genero: user.genero || null,
                pronombres: user.pronombres || null
            };
            const res = await fetch(`${API_BASE}/api/usuarios/usuario`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b.error || "Error guardando perfil");
            }
            await loadProfile();
        } catch (err) {
            console.error("saveProfile:", err);
            setError("No se pudo guardar el perfil.");
        } finally {
            setSaving(false);
        }
    }

    async function saveLikes() {
        if (!user) return;
        setSaving(true);
        setError("");
        try {
            const payload = { gustos: Array.isArray(user.gustos) ? user.gustos : [] };
            const res = await fetch(`${API_BASE}/api/usuarios/usuario`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(payload)
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b.error || `Error guardando gustos (status ${res.status})`);
            }
            const body = await res.json().catch(() => ({}));
            if (body && body.usuario && Array.isArray(body.usuario.gustos)) {
                setUser(prev => ({ ...prev, gustos: body.usuario.gustos }));
            } else {
                await loadProfile();
            }
        } catch (err) {
            console.error("saveLikes:", err);
            setError("No se pudieron guardar los gustos.");
        } finally {
            setSaving(false);
        }
    }

    async function changePassword() {
        setPwMessage("");
        if (!passwordState.current || !passwordState.nuevo) { setPwMessage("Rellena ambos campos."); return; }
        if (passwordState.nuevo.length < 8) { setPwMessage("La nueva contraseña debe tener al menos 8 caracteres."); return; }
        if (passwordState.nuevo !== passwordState.confirm) { setPwMessage("La confirmación no coincide."); return; }

        setPwLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/usuarios/usuario/password`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ currentPassword: passwordState.current, newPassword: passwordState.nuevo })
            });
            if (!res.ok) {
                const b = await res.json().catch(() => ({}));
                throw new Error(b.error || "Error cambiando contraseña");
            }
            setPwMessage("Contraseña cambiada correctamente.");
            setPasswordState({ current: "", nuevo: "", confirm: "" });
        } catch (err) {
            console.error("changePassword:", err);
            setPwMessage("No se pudo cambiar la contraseña. Comprueba la actual.");
        } finally {
            setPwLoading(false);
        }
    }

    if (loading) return <div className="page-layout"><main className="page-main-content"><p className="loading-text">Cargando perfil…</p></main></div>;

    const generoOptions = mergeList(LOCAL_GENEROS, [user?.genero]);
    const pronombresOptions = mergeList(LOCAL_PRONOMBRES, [user?.pronombres]);

    const personajesMap = new Map();
    partners.forEach(p => {
        const pid = String(p.id || p._id || p.key || "");
        const pname = p.nombre || p.name || pid;
        if (pid) personajesMap.set(pid, pname);
    });
    if (user?.personaje?.id) {
        const uid = String(user.personaje.id);
        const uname = user.personaje.nombre || personajesMap.get(uid) || uid;
        if (!personajesMap.has(uid)) personajesMap.set(uid, uname);
    }
    const personajesOptions = Array.from(personajesMap.entries()).map(([id, nombre]) => ({ id, nombre }));

    const handleChangePersonaje = () => {
        navigate("/selectPartner", { state: { from: "perfilUsuario", returnTo: "/perfilUsuario" } });
    };

    return (
        <div className="page-layout">
            <main className="page-main-content">
                <div className="admin-container">
                    <Card>
                        <header className="admin-header">
                            <div className="header-title">
                                <h1 className="page-title">Mi perfil</h1>
                                <p className="muted">Edita tus datos</p>
                            </div>
                            <div className="header-actions">
                                <button onClick={() => navigate("/dashboard")} className="btn">Volver</button>
                            </div>
                        </header>

                        {error && <p className="error">{error}</p>}

                        <div className="perfil-main">
                            <label>Nombre</label>
                            <input className="input-adapt" value={user.nombre} onChange={e => handleChange("nombre", e.target.value)} />

                            <label>Email</label>
                            <input className="input-adapt" value={user.email} onChange={e => handleChange("email", e.target.value)} />

                            <div className="row-three">
                                <div className="col">
                                    <label>Género</label>
                                    <select className="input-adapt" value={user.genero || ""} onChange={e => handleChange("genero", e.target.value)}>
                                        <option value="">(vacío)</option>
                                        {generoOptions.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>

                                <div className="col">
                                    <label>Pronombres</label>
                                    <select className="input-adapt" value={user.pronombres || ""} onChange={e => handleChange("pronombres", e.target.value)}>
                                        <option value="">(vacío)</option>
                                        {pronombresOptions.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </div>

                                <div className="col personaje">
                                    <label>Personaje</label>

                                    <div className="personaje-controls"
                                        style={{ display: "flex", gap: "8px", alignItems: "center", marginTop: "0" }}>
                                        <input
                                            className="input-adapt personaje-input"
                                            value={(user.personaje && (user.personaje.nombre || user.personaje.id)) || "(ninguno)"}
                                            readOnly
                                            style={{ marginTop: 0, alignSelf: "center" }}
                                        />

                                        <button
                                            className="btn personaje-btn"
                                            onClick={handleChangePersonaje}
                                            style={{ marginTop: 0, alignSelf: "center" }}
                                        >
                                            Cambiar personaje
                                        </button>
                                    </div>

                                </div>
                            </div>

                            <div className="actions-row">
                                <button className="btn" onClick={saveProfile} disabled={saving}>{saving ? "Guardando..." : "Guardar perfil"}</button>
                            </div>

                            <hr className="section-divider" />

                            <div>
                                <h3>Cambiar contraseña</h3>
                                <p className="muted">Introduce tu contraseña actual para confirmar el cambio.</p>

                                <label>Contraseña actual</label>
                                <input type="password" className="input-adapt" value={passwordState.current} onChange={e => setPasswordState(s => ({ ...s, current: e.target.value }))} />

                                <label>Nueva contraseña</label>
                                <input type="password" className="input-adapt" value={passwordState.nuevo} onChange={e => setPasswordState(s => ({ ...s, nuevo: e.target.value }))} />

                                <label>Confirmar nueva contraseña</label>
                                <input type="password" className="input-adapt" value={passwordState.confirm} onChange={e => setPasswordState(s => ({ ...s, confirm: e.target.value }))} />

                                <div className="actions-row" style={{ marginTop: 12 }}>
                                    <button className="btn" onClick={changePassword} disabled={pwLoading}>{pwLoading ? "Cambiando..." : "Cambiar contraseña"}</button>
                                    {pwMessage && <div className="pw-message">{pwMessage}</div>}
                                </div>
                            </div>
                        </div>
                    </Card>

                    <div className="card-gap">
                        <Card>
                            <header className="card-header">
                                <h3 className="card-title">Gustos</h3>
                                <p className="muted card-sub">Añade preferencias para recomendaciones</p>
                            </header>

                            <div className="gustos-controls">
                                <input className="input-adapt" value={newGusto} onChange={e => setNewGusto(e.target.value)} placeholder="Añadir gusto (ej. café)" />
                                <button className="btn small" onClick={addGusto}>Añadir</button>
                            </div>

                            <div className="gustos-list">
                                {user.gustos && user.gustos.length ? user.gustos.map(g => (
                                    <div key={g} className="gusto-pill">
                                        <span className="gusto-text">{g}</span>
                                        <button className="btn tiny" onClick={() => removeGusto(g)}>✕</button>
                                    </div>
                                )) : <div className="muted">No hay gustos añadidos.</div>}
                            </div>

                            <div className="actions-row" style={{ marginTop: 16 }}>
                                <button className="btn" onClick={saveLikes} disabled={saving}>{saving ? "Guardando..." : "Guardar gustos"}</button>
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
