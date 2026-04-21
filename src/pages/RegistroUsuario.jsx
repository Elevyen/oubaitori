import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/registro-usuario.css";

export default function RegistroUsuario() {
    const navigate = useNavigate();
    const { setUser } = useContext(AuthContext);

    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const passwordRef = useRef(null);

    const [gender, setGender] = useState("");
    const [pronouns, setPronouns] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        const password = passwordRef.current?.value ?? "";

        if (!nombre || !email || !password) {
            setError("Por favor, completa todos los campos.");
            if (passwordRef.current) passwordRef.current.value = "";
            return;
        }

        const safePending = {
            nombre,
            email,
            gender: gender || null,
            pronouns: pronouns || null
        };

        try {
            sessionStorage.setItem("pendingUser", JSON.stringify(safePending));
        } catch (err) {
        }

        try {
            setUser && setUser({ nombre: safePending.nombre, email: safePending.email });
        } catch (err) {
        }

        if (passwordRef.current) passwordRef.current.value = "";

        navigate("/selectPartner", { state: { pendingUser: safePending } });
    };

    const displayPronouns = () => pronouns || "—";

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
                            <select value={gender} onChange={(e) => setGender(e.target.value)} aria-label="Género">
                                <option value="mujer">Mujer</option>
                                <option value="hombre">Hombre</option>
                                <option value="nobinario">No binario</option>
                                <option value="otro">Otro</option>
                                <option value="">Prefiero no decirlo</option>
                            </select>
                        </label>

                        <label className="field">
                            <div className="field-label">Pronombres (opcional)</div>
                            <select value={pronouns} onChange={(e) => setPronouns(e.target.value)} aria-label="Pronombres">
                                <option value="ella">Ella</option>
                                <option value="él">Él</option>
                                <option value="elle">Elle</option>
                                <option value="">Prefiero no decirlo</option>
                            </select>
                        </label>

                        {error && <p className="error">{error}</p>}

                        <button type="submit" className="rpg-button">Registrarme</button>
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
