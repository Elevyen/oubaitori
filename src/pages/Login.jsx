import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const API_BASE =
    (typeof import.meta !== "undefined" &&
        import.meta.env &&
        (import.meta.env.VITE_LOCAL_BACKEND ||
            import.meta.env.VITE_RENDER_BACKEND)) ||
    "";

// Nombre de admin hardcoded (compara con el email normalizado)
const ADMIN_NAME = "OubaitoriDB_Admin";

export default function Login() {
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [loading, setLoading] = useState(false);

    // Comprueba si el email existe en el backend
    async function checkEmailExists(emailToCheck) {
        try {
            const res = await fetch(`${API_BASE}/api/usuarios/check-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailToCheck }),
            });
            if (!res.ok) return { ok: false, exists: false };
            const data = await res.json().catch(() => ({}));
            return { ok: true, exists: !!data.exists };
        } catch (err) {
            console.error("Error comprobando email:", err);
            return { ok: false, exists: false };
        }
    }

    // Helper: formato fecha YYYY-MM-DD
    const formatLocalDateYYYYMMDD = (d = new Date()) => {
        try {
            return new Date(d).toISOString().slice(0, 10);
        } catch (e) {
            return String(d).slice(0, 10);
        }
    };

    // Maneja el submit del formulario
    const onSubmit = async (event) => {
        event.preventDefault();
        setErrorMsg("");

        if (!email || !password) {
            setErrorMsg("Por favor, completa todos los campos.");
            return;
        }

        setLoading(true);
        const emailNorm = email.toLowerCase().trim();

        try {
            // Caso admin local (comprobación especial)
            if (emailNorm === ADMIN_NAME.toLowerCase()) {
                const adminRes = await fetch(`${API_BASE}/api/internal/check-mongo-pass`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password }),
                });

                let adminData;
                try {
                    adminData = await adminRes.json();
                } catch (e) {
                    adminData = { error: await adminRes.text().catch(() => "") };
                }

                if (!adminRes.ok) {
                    setErrorMsg(adminData.error || "Credenciales de administrador inválidas.");
                    setLoading(false);
                    return;
                }

                // Guardamos el usuario admin tal como venga del servidor
                const userObj = {
                    id: adminData.id || "admin",
                    nombre: adminData.nombre || ADMIN_NAME,
                    email: adminData.email || `${ADMIN_NAME}@local`,
                    token: adminData.token || "",
                    role: "admin",
                };
                setUser && setUser(userObj);
                try {
                    localStorage.setItem("tokenLogin", userObj.token);
                } catch (err) { }

                // Redirigir al perfil de admin
                navigate("/perfilAdmin");
                setLoading(false);
                return;
            }

            // Usuario normal: comprobar existencia de email
            const check = await checkEmailExists(emailNorm);
            if (!check.ok) {
                setErrorMsg("No se pudo comprobar el correo. Intenta de nuevo.");
                setLoading(false);
                return;
            }
            if (!check.exists) {
                setErrorMsg("No existe una cuenta con ese correo. Regístrate primero.");
                setLoading(false);
                return;
            }

            // Intento de login normal
            const res = await fetch(`${API_BASE}/api/usuarios/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailNorm, password }),
            });

            let data;
            try {
                data = await res.json();
            } catch (e) {
                data = { error: await res.text().catch(() => "") };
            }

            if (!res.ok) {
                setErrorMsg(data.error || "Credenciales inválidas.");
                setLoading(false);
                return;
            }

            // Construir objeto usuario básico
            const userObj = {
                id: data.id,
                nombre: data.nombre || "",
                email: data.email || emailNorm,
                token: data.token,
                role: data.role || (data.isAdmin ? "admin" : "user"),
            };

            // Si hay personaje seleccionado en storage, lo añadimos provisionalmente
            try {
                const selectedPartner =
                    localStorage.getItem("selectedPartner") || sessionStorage.getItem("selectedPartner");
                if (selectedPartner) {
                    userObj.personaje = { id: selectedPartner, nombre: null };
                }
            } catch (err) {
                // ignorar errores de storage
            }

            setUser && setUser(userObj);
            try {
                localStorage.setItem("tokenLogin", data.token);
            } catch (err) { }

            // Intentar obtener perfil completo desde backend
            try {
                const profileRes = await fetch(`${API_BASE}/api/usuarios/usuario`, {
                    headers: { Authorization: `Bearer ${data.token}` },
                });
                if (profileRes.ok) {
                    const profileJson = await profileRes.json().catch(() => ({}));
                    const profile = profileJson.usuario || profileJson || {};
                    const updated = {
                        ...userObj,
                        personaje: profile.personaje || userObj.personaje || null,
                        genero: profile.genero || null,
                        pronombres: profile.pronombres || null,
                        nombre: profile.nombre || userObj.nombre,
                    };
                    setUser && setUser(updated);
                    // Si el backend marca rol admin, respetarlo
                    if (profile.role === "admin" || profile.isAdmin) {
                        updated.role = "admin";
                        setUser && setUser(updated);
                    }
                }
            } catch (err) {
                console.error("Error obteniendo perfil:", err);
            }

            // Si el usuario es admin (según lo que tengamos), ir a PerfilAdmin
            const finalRole = (userObj.role || "").toLowerCase();
            if (finalRole === "admin") {
                navigate("/perfil-admin");
                setLoading(false);
                return;
            }

            // Por defecto, ir al dashboard con el personaje (si existe)
            const personajeState = userObj.personaje || null;

            // --- Recuperar último análisis local
            let lastAnalisisLocal = null;
            try {
                const key = `lastAnalisis_${String(userObj.id)}`;
                const raw = localStorage.getItem(key);
                lastAnalisisLocal = raw ? JSON.parse(raw) : null;
            } catch (e) {
                console.debug("Login: error reading lastAnalisis local", e);
                lastAnalisisLocal = null;
            }

            // --- Intento rápido de sincronizar con servidor (no bloqueante)
            try {
                (async () => {
                    try {
                        const fechaToCheck =
                            (lastAnalisisLocal && lastAnalisisLocal.fechaClave) || formatLocalDateYYYYMMDD();
                        const resp = await fetch(
                            `${API_BASE}/api/AnalisisDiario/fecha/${encodeURIComponent(fechaToCheck)}`,
                            {
                                headers: { Authorization: `Bearer ${data.token}`, "Content-Type": "application/json" },
                            }
                        );
                        if (resp.ok) {
                            const j = await resp.json().catch(() => null);
                            const lastAnalisisServer = j?.analisis || null;
                            // opcional: sobrescribir localStorage con la versión del servidor
                            try {
                                if (lastAnalisisServer) {
                                    const normalized = {
                                        fechaClave: lastAnalisisServer.fechaClave,
                                        analisisId: lastAnalisisServer._id || null,
                                        resumen: lastAnalisisServer.resumenAnalisis || lastAnalisisServer.resumen || null,
                                        savedAt: Date.now(),
                                    };
                                    localStorage.setItem(`lastAnalisis_${String(userObj.id)}`, JSON.stringify(normalized));
                                }
                            } catch (e) {
                                /* ignore */
                            }
                        }
                    } catch (e) {
                        console.debug("Login: background fetch lastAnalisis failed", e);
                    }
                })();
            } catch (e) {
                console.debug("Login: cannot start background sync", e);
            }

            // --- Navegar pasando el análisis (local inmediato + server en background)
            navigate("/dashboard", {
                state: {
                    personaje: personajeState,
                    lastAnalisisLocal,
                },
            });
        } catch (err) {
            console.error("Error en login frontend:", err);
            setErrorMsg("Error de red. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-layout">
            <main className="page-main-content">
                <div className="login-container">
                    <h1>Oubaitori</h1>
                    <h2>Iniciar sesión</h2>

                    <form onSubmit={onSubmit} className="login-form">
                        <input
                            type="text"
                            placeholder="Correo electrónico o Admin"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {errorMsg && <p className="error">{errorMsg}</p>}
                        <button type="submit" disabled={loading}>
                            {loading ? "Entrando..." : "Entrar"}
                        </button>
                    </form>

                    <p className="registro-link">
                        ¿No tienes cuenta? <a href="/registro">Regístrate</a>
                    </p>
                </div>
            </main>
        </div>
    );
}
