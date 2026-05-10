import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card.jsx";
import "../styles/admin.css";
import { formatDateTime } from "../utils/date";
const API_BASE =
    (typeof import.meta !== "undefined" &&
        import.meta.env &&
        (import.meta.env.VITE_LOCAL_BACKEND ||
            import.meta.env.VITE_RENDER_BACKEND)) ||
    "";

function getToken() {
    try {
        return localStorage.getItem("tokenLogin") || "";
    } catch {
        return "";
    }
}

function clearTokenAndRedirect(navigate, message) {
    try { localStorage.removeItem("tokenLogin"); } catch { }
    if (message) alert(message);
    navigate("/login");
}

/* Opciones locales fijas (no en la base de datos) */
const LOCAL_GENEROS = ["mujer", "hombre", "nobinario", "prefiero no decirlo", "otro"];
const LOCAL_PRONOMBRES = ["él", "ella", "elle", "prefiero no decirlo"];

function mergeList(baseList, extras) {
    const out = [...baseList];
    (Array.isArray(extras) ? extras : []).forEach((v) => {
        if (v == null || v === "") return;
        const s = String(v);
        if (!out.includes(s)) out.unshift(s);
    });
    return out;
}

export default function PerfilAdmin() {
    const navigate = useNavigate();

    // Usuarios
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [error, setError] = useState("");
    const [selectedId, setSelectedId] = useState(null);
    const [editingId, setEditingId] = useState(null);

    // Personajes (cargados desde backend)
    const [personajes, setPersonajes] = useState([]);
    const [loadingPersonajes, setLoadingPersonajes] = useState(false);
    const [personajesError, setPersonajesError] = useState("");

    // Mensajes (antes "contactos")
    const [mensajes, setMensajes] = useState([]);
    const [loadingMensajes, setLoadingMensajes] = useState(false);
    const [togglingId, setTogglingId] = useState(null);
    const [mensajesError, setMensajesError] = useState("");

    useEffect(() => {
        fetchUsers();
        fetchPersonajes();
        fetchMensajes();
    }, []);

    /* ------------------ Usuarios ------------------ */
    async function fetchUsers() {
        setLoading(true);
        setError("");
        const token = getToken();
        if (!token) {
            setError("No hay token. Inicia sesión.");
            setUsers([]);
            setLoading(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/usuarios?limit=200`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                clearTokenAndRedirect(navigate, "Sesión inválida. Vuelve a iniciar sesión.");
                return;
            }

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setError(body.error || body.message || "Error cargando usuarios.");
                setUsers([]);
                setLoading(false);
                return;
            }

            const data = await res.json();
            const list = data.usuarios || data;
            // Normalizar y filtrar usuarios sin id para evitar filas con id vacío
            const normalized = (Array.isArray(list) ? list : [])
                .map((u) => ({
                    ...u,
                    _id: u._id || u.id || (u && (u._id || u.id) ? String(u._id || u.id) : ""),
                    nombre: u.nombre || u.name || u.username || "",
                    email: u.email || "",
                    genero: u.genero || u.gender || "",
                    pronombres: u.pronombres || u.pronouns || "",
                    personaje:
                        u.personaje && typeof u.personaje === "object"
                            ? u.personaje
                            : u.personaje
                                ? { id: String(u.personaje), nombre: "" }
                                : null
                }))
                .filter((u) => u._id);
            setUsers(normalized);
        } catch (err) {
            console.error("fetchUsers:", err);
            setError("No se pudieron cargar los usuarios (error de red).");
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }

    async function fetchUserFull(id) {
        if (!id) return null;
        try {
            const res = await fetch(`${API_BASE}/api/usuarios/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            if (!res.ok) return null;
            const data = await res.json();
            const u = data.usuario || data;
            return {
                ...u,
                _id: u._id || u.id || id,
                nombre: u.nombre || u.name || u.username || "",
                email: u.email || "",
                genero: u.genero || u.gender || "",
                pronombres: u.pronombres || u.pronouns || "",
                personaje:
                    u.personaje && typeof u.personaje === "object"
                        ? u.personaje
                        : u.personaje
                            ? { id: String(u.personaje), nombre: "" }
                            : null
            };
        } catch (err) {
            console.error("fetchUserFull:", err);
            return null;
        }
    }

    //Recuperamos los personajes para editar con el listado
    async function fetchPersonajes() {
        setLoadingPersonajes(true);
        setPersonajesError("");
        const token = getToken();
        if (!token) {
            setPersonajesError("No hay token. Inicia sesión.");
            setPersonajes([]);
            setLoadingPersonajes(false);
            return;
        }

        try {
            // Llamamos al endpoint correcto
            const res = await fetch(`${API_BASE}/api/partners/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                clearTokenAndRedirect(navigate, "Sesión inválida. Vuelve a iniciar sesión.");
                return;
            }

            if (res.status === 404) {
                setPersonajesError("Endpoint /api/partners/all no encontrado (404). Revisa el backend.");
                setPersonajes([]);
                return;
            }

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setPersonajesError(body.error || body.message || "Error cargando partners.");
                setPersonajes([]);
                return;
            }

            const data = await res.json();

            // Normalizar: aceptar { ok:true, partners: [...] } o lista directa
            const list = (data && data.partners) || data.items || data.results || data.data || data || [];
            const normalized = (Array.isArray(list) ? list : []).map((p) => ({
                id: p._id || p.id || String(p._id || p.id || ""),
                nombre: p.nombre || p.name || p.title || String(p._id || p.id || "")
            })).filter(p => p.id);

            setPersonajes(normalized);
        } catch (err) {
            console.error("fetchPersonajes (partners/all):", err);
            setPersonajesError("No se pudieron cargar los partners (error de red).");
            setPersonajes([]);
        } finally {
            setLoadingPersonajes(false);
        }
    }


    function stop(ev) { ev.stopPropagation(); }

    function handleChange(id, field, value) {
        setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, [field]: value } : u)));
    }

    async function saveUser(id) {
        setSavingId(id);
        setError("");
        const user = users.find((u) => u._id === id);
        if (!user) { setSavingId(null); return; }
        const payload = {
            nombre: user.nombre,
            email: user.email,
            genero: user.genero || null,
            pronombres: user.pronombres || null,
            personaje: user.personaje || {}
        };
        try {
            const res = await fetch(`${API_BASE}/api/usuarios/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify(payload)
            });

            if (res.status === 401) {
                clearTokenAndRedirect(navigate, "Sesión inválida. Vuelve a iniciar sesión.");
                return;
            }

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || body.message || "Error guardando usuario");
            }

            await fetchUsers();
            setEditingId(null);
        } catch (err) {
            console.error("saveUser:", err);
            setError("No se pudo guardar el usuario.");
        } finally {
            setSavingId(null);
        }
    }

    async function deleteUser(id) {
        const ok = window.confirm("¿Seguro que quieres borrar este usuario? Esta acción no se puede deshacer.");
        if (!ok) return;
        setDeletingId(id);
        setError("");
        try {
            const res = await fetch(`${API_BASE}/api/usuarios/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` }
            });

            if (res.status === 401) {
                clearTokenAndRedirect(navigate, "Sesión inválida. Vuelve a iniciar sesión.");
                return;
            }

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.error || body.message || "Error borrando usuario");
            }

            setUsers((prev) => prev.filter((u) => u._id !== id));
            if (selectedId === id) setSelectedId(null);
            if (editingId === id) setEditingId(null);
        } catch (err) {
            console.error("deleteUser:", err);
            setError("No se pudo borrar el usuario.");
        } finally {
            setDeletingId(null);
        }
    }

    function buildOpciones(list) {
        const generosSet = new Set();
        const pronombresSet = new Set();

        (Array.isArray(list) ? list : []).forEach((u) => {
            if (u && u.genero) generosSet.add(String(u.genero));
            if (u && u.pronombres) pronombresSet.add(String(u.pronombres));
        });

        const detectedGeneros = Array.from(generosSet);
        const detectedPronombres = Array.from(pronombresSet);

        const generos = mergeList(LOCAL_GENEROS, detectedGeneros);
        const pronombres = mergeList(LOCAL_PRONOMBRES, detectedPronombres);

        // Personajes provienen de la carga directa desde la BD (estado personajes)
        const personajesList = personajes.map(p => ({ id: p.id, nombre: p.nombre }));

        return {
            generos,
            pronombres,
            personajes: personajesList
        };
    }

    const opciones = buildOpciones(users);

    /* ------------------ Mensajes (contacto) ------------------ */

    async function fetchMensajes(page = 1, limit = 100) {
        setLoadingMensajes(true);
        setMensajesError("");
        const token = getToken();
        if (!token) {
            setMensajesError("No hay token. Inicia sesión.");
            setMensajes([]);
            setLoadingMensajes(false);
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/api/contacto?page=${page}&limit=${limit}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.status === 401) {
                clearTokenAndRedirect(navigate, "Sesión inválida o token inválido. Vuelve a iniciar sesión.");
                return;
            }

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                setMensajesError(body.message || body.error || "Error cargando mensajes.");
                setMensajes([]);
                setLoadingMensajes(false);
                return;
            }

            const data = await res.json();
            const items = data.items || data || [];
            setMensajes(Array.isArray(items) ? items : []);
        } catch (err) {
            console.error("fetchMensajes:", err);
            setMensajesError("No se pudieron cargar los mensajes (error de red).");
            setMensajes([]);
        } finally {
            setLoadingMensajes(false);
        }
    }

    async function toggleResuelto(contactId, newValue) {
        setTogglingId(contactId);
        setMensajesError("");
        try {
            const res = await fetch(`${API_BASE}/api/contacto/${contactId}/resuelto`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ resuelto: !!newValue })
            });

            if (res.status === 401) {
                clearTokenAndRedirect(navigate, "Sesión inválida. Vuelve a iniciar sesión.");
                return;
            }

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || body.error || `Error servidor (${res.status})`);
            }

            const json = await res.json().catch(() => ({}));
            setMensajes((prev) => prev.map((c) => (c._id === contactId ? { ...c, resuelto: json.resuelto, resueltoAt: json.resueltoAt } : c)));
        } catch (err) {
            console.error("toggleResuelto:", err);
            setMensajesError("No se pudo actualizar el estado del mensaje.");
        } finally {
            setTogglingId(null);
        }
    }

    /* ------------------ UI: filas ------------------ */
    function UserRow({ u }) {
        const isSelected = selectedId === u._id;
        const editable = editingId === u._id;
        const displayGenero = u.genero || "—";
        const displayPronombres = u.pronombres || "—";
        const displayPersonaje = (u.personaje && (u.personaje.nombre || u.personaje.id)) || "—";

        // Cuando el usuario no tiene genero/pronombres, mostramos la primera opción disponible
        const generoValue = editable ? (u.genero || (opciones.generos.length ? opciones.generos[0] : "")) : displayGenero;
        const pronombresValue = editable ? (u.pronombres || (opciones.pronombres.length ? opciones.pronombres[0] : "")) : displayPronombres;
        // Para personaje: si no hay personaje asignado, usamos el primer personaje disponible (si existe)
        const personajeValue = editable
            ? ((u.personaje && (u.personaje.id || "")) || (opciones.personajes.length ? opciones.personajes[0].id : ""))
            : (u.personaje && (u.personaje.id || u.personaje._id) ? (u.personaje.id || u.personaje._id) : "");

        return (
            <tr key={u._id} className={isSelected ? "row-selected" : ""} onClick={() => setSelectedId((prev) => (prev === u._id ? null : u._id))}>
                <td>
                    <input
                        value={u.nombre || ""}
                        onChange={(e) => { stop(e); handleChange(u._id, "nombre", e.target.value); }}
                        className="input-small"
                        disabled={!editable}
                        onClick={stop}
                    />
                </td>
                <td>
                    <input
                        value={u.email || ""}
                        onChange={(e) => { stop(e); handleChange(u._id, "email", e.target.value); }}
                        className="input-small"
                        disabled={!editable}
                        onClick={stop}
                    />
                </td>
                <td>{editable ? (
                    <select value={generoValue} onChange={(e) => { stop(e); handleChange(u._id, "genero", e.target.value); }} className="input-small" onClick={stop}>
                        {/* Sin opción vacía */}
                        {opciones.generos.map((g) => <option key={g} value={g}>{g}</option>)}
                        {opciones.generos.length === 0 && <option disabled>—</option>}
                    </select>
                ) : <span className="cell-text">{displayGenero}</span>}</td>

                <td>{editable ? (
                    <select value={pronombresValue} onChange={(e) => { stop(e); handleChange(u._id, "pronombres", e.target.value); }} className="input-small" onClick={stop}>
                        {opciones.pronombres.map((p) => <option key={p} value={p}>{p}</option>)}
                        {opciones.pronombres.length === 0 && <option disabled>—</option>}
                    </select>
                ) : <span className="cell-text">{displayPronombres}</span>}</td>

                <td>{editable ? (
                    <select value={personajeValue} onChange={(e) => {
                        stop(e);
                        const pid = e.target.value;
                        const found = opciones.personajes.find((pp) => pp.id === pid);
                        handleChange(u._id, "personaje", pid ? { id: pid, nombre: found ? found.nombre : "" } : null);
                    }} className="input-small" onClick={stop}>
                        {/* Eliminada la opción "(ninguno)". Si no hay personajes mostramos — deshabilitado */}
                        {opciones.personajes.length > 0 ? opciones.personajes.map((p) => <option key={p.id} value={p.id}>{p.nombre || p.id}</option>) : <option disabled>—</option>}
                    </select>
                ) : <span className="cell-text">{displayPersonaje}</span>}</td>

                <td style={{ textAlign: "right", minWidth: 140 }}>
                    <button onClick={(ev) => {
                        ev.stopPropagation();
                        (async () => {
                            const full = await fetchUserFull(u._id);
                            if (full) setUsers((prev) => prev.map((x) => (x._id === u._id ? { ...x, ...full } : x)));
                            setEditingId(u._id);
                            setSelectedId(u._id);
                        })();
                    }} className="btn small" title="Editar" style={{ marginRight: 8 }}>Editar</button>

                    {editingId === u._id ? (
                        <>
                            <button onClick={(ev) => { ev.stopPropagation(); saveUser(u._id); }} disabled={savingId === u._id} className="btn small" style={{ marginRight: 8 }}>
                                {savingId === u._id ? "Guardando..." : "Guardar"}
                            </button>
                            <button onClick={(ev) => { ev.stopPropagation(); setEditingId(null); }} className="btn small" style={{ marginRight: 8 }}>Cancelar</button>
                        </>
                    ) : null}

                    <button onClick={(ev) => { ev.stopPropagation(); deleteUser(u._id); }} className="btn small danger" title="Borrar usuario">🗑️</button>
                </td>
            </tr>
        );
    }

    function MensajeRow({ m }) {
        const isResolved = !!m.resuelto;
        const toggling = togglingId === m._id;
        return (
            <tr key={m._id} className={isResolved ? "row-resolved" : ""}>
                <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(m.createdAt)}</td>
                <td>{m.tipo}</td>
                <td>{m.titulo}</td>
                <td style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>{m.mensaje}</td>
                <td>{m.email}</td>
                <td style={{ textAlign: "center" }}>
                    <input type="checkbox" checked={isResolved} disabled={toggling} onChange={() => toggleResuelto(m._id, !isResolved)} aria-label={isResolved ? "Marcar como no resuelto" : "Marcar como resuelto"} />
                </td>
            </tr>
        );
    }

    return (
        <div className="page-layout">
            <main className="page-main-content">
                <div className="admin-container">
                    <Card>
                        <header className="admin-header">
                            <div>
                                <h1 style={{ margin: 0 }}>Administración Oubaitori</h1>
                                <p className="muted">Gestiona usuarios registrados</p>
                            </div>
                            <div className="header-actions">
                                <button onClick={() => navigate("/")} className="btn">Volver</button>
                                <button onClick={fetchUsers} className="btn" style={{ marginLeft: 8 }}>Refrescar</button>
                            </div>
                        </header>

                        {error && <p className="error" style={{ marginTop: 12 }}>{error}</p>}

                        {loading ? (
                            <p style={{ marginTop: 12 }}>Cargando usuarios…</p>
                        ) : (
                            <div style={{ overflowX: "auto", marginTop: 12 }}>
                                <table className="table admin-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Email</th>
                                            <th>Género</th>
                                            <th>Pronombres</th>
                                            <th>Personaje</th>
                                            <th style={{ textAlign: "right" }}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length === 0 ? (
                                            <tr><td colSpan={6}>No hay usuarios registrados.</td></tr>
                                        ) : (
                                            users.map((u) => <UserRow key={u._id} u={u} />)
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>

                    <Card style={{ marginTop: 20 }}>
                        <header className="admin-header">
                            <div>
                                <h2 style={{ margin: 0 }}>Mensajes recibidos</h2>
                                <p className="muted">Marca como resuelto los mensajes gestionados</p>
                            </div>
                            <div className="header-actions">
                                <button onClick={fetchMensajes} className="btn">Refrescar</button>
                            </div>
                        </header>

                        {mensajesError && <p className="error" style={{ marginTop: 12 }}>{mensajesError}</p>}

                        {loadingMensajes ? (
                            <p style={{ marginTop: 12 }}>Cargando mensajes…</p>
                        ) : (
                            <div style={{ overflowX: "auto", marginTop: 12 }}>
                                <table className="table admin-table">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Tipo</th>
                                            <th>Título</th>
                                            <th>Mensaje</th>
                                            <th>Remitente</th>
                                            <th style={{ textAlign: "center" }}>Resuelto</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {mensajes.length === 0 ? (
                                            <tr><td colSpan={6}>No hay mensajes.</td></tr>
                                        ) : (
                                            mensajes.map((m) => <MensajeRow key={m._id} m={m} />)
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </div>
            </main>
        </div>
    );
}
