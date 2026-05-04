import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/registro-usuario.css";

const API_BASE =
    (typeof import.meta !== "undefined" &&
        import.meta.env &&
        (import.meta.env.VITE_LOCAL_BACKEND ||
            import.meta.env.VITE_RENDER_BACKEND ||
            import.meta.env.VITE_API_BASE)) ||
    "";

export default function RegistroUsuario() {
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const passwordRef = useRef(null);
    const [genero, setGenero] = useState("");
    const [pronombres, setPronombres] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function checkEmailExists(emailToCheck) {
        try {
            const res = await fetch(`${API_BASE}/api/usuarios/check-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: emailToCheck })
            });
            if (!res.ok) return { ok: false, exists: false };
            const data = await res.json().catch(() => ({}));
            return { ok: true, exists: !!data.exists };
        } catch (err) {
            console.error("Error comprobando email:", err);
            return { ok: false, exists: false };
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        const password = passwordRef.current?.value ?? "";
        const emailNorm = (email || "").toLowerCase().trim();

        if (!nombre || !emailNorm || !password) {
            setError("Por favor, completa todos los campos.");
            if (passwordRef.current) passwordRef.current.value = "";
            return;
        }

        setLoading(true);
        try {
            // Comprueba si el email ya está registrado
            const check = await checkEmailExists(emailNorm);
            if (!check.ok) {
                setError("No se pudo comprobar el correo. Intenta de nuevo.");
                return;
            }
            if (check.exists) {
                setError("Ya existe un usuario con ese correo.");
                return;
            }

            // Si no existe, crea el pendingUser en el backend
            const res = await fetch(`${API_BASE}/api/usuarios/create-pending`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nombre,
                    email: emailNorm,
                    password,
                    genero: genero || null,
                    pronombres: pronombres || null
                })
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                if (res.status === 409) {
                    setError("Ya existe un usuario con ese correo.");
                } else {
                    setError(data.error || "Error comprobando el correo. Intenta de nuevo.");
                }
                return;
            }

            const { pendingToken, pendingUser } = data;
            if (!pendingToken) {
                setError("No se pudo iniciar el registro. Intenta de nuevo.");
                return;
            }

            // No guardamos la contraseña en el cliente
            if (passwordRef.current) passwordRef.current.value = "";

            navigate("/selectPartner", { state: { pendingUser, pendingToken } });
        } catch (err) {
            console.error("Error en comprobación frontend:", err);
            setError("Error de red. Intenta de nuevo.");
        } finally {
            setLoading(false);
            if (passwordRef.current) passwordRef.current.value = "";
        }
    };

    const displayPronouns = () => pronombres || "—";

    return (
        <div className="page-layout">
            <main className="page-main-content">
                <div className="login-container">
                    <h1>Oubaitori</h1>
                    <h2>Crear cuenta</h2>
                    <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            autoComplete="name"
                        />
                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                        <input
                            ref={passwordRef}
                            type="password"
                            placeholder="Contraseña"
                            autoComplete="new-password"
                        />
                        <label className="field">
                            <div className="field-label">Género (opcional)</div>
                            <select value={genero} onChange={(e) => setGenero(e.target.value)} aria-label="Género">
                                <option value="mujer">Mujer</option>
                                <option value="hombre">Hombre</option>
                                <option value="nobinario">No binario</option>
                                <option value="otro">Otro</option>
                                <option value="">Prefiero no decirlo</option>
                            </select>
                        </label>
                        <label className="field">
                            <div className="field-label">Pronombres (opcional)</div>
                            <select value={pronombres} onChange={(e) => setPronombres(e.target.value)} aria-label="Pronombres">
                                <option value="ella">Ella</option>
                                <option value="él">Él</option>
                                <option value="elle">Elle</option>
                                <option value="">Prefiero no decirlo</option>
                            </select>
                        </label>
                        {error && <p className="error">{error}</p>}
                        <button type="submit" className="rpg-button" disabled={loading}>
                            {loading ? "Comprobando..." : "Continuar"}
                        </button>
                    </form>

                    <p className="registro-link">
                        ¿Ya tienes cuenta? <a href="/">Inicia sesión</a>
                    </p>

                    <div style={{ marginTop: 18, fontSize: 13, color: "#444" }}>
                        <strong>Pronombres seleccionados:</strong> {displayPronouns()}
                    </div>
                </div>
            </main>
        </div>
    );
}
