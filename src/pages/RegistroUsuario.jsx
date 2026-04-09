import { useContext, useState } from "react"
import { useNavigate } from "react-router-dom"
import { AuthContext } from "../context/AuthContext"

export default function RegistroUsuario() {
    const navigate = useNavigate()
    const { setUser } = useContext(AuthContext)

    const [nombre, setNombre] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")

    const handleSubmit = (e) => {
        e.preventDefault()

        if (!nombre || !email || !password) {
            setError("Por favor, completa todos los campos.")
            return
        }

        // Simulación de registro correcto
        const newUser = {
            id: "001",
            nombre,
            email
        }

        setUser(newUser)
        navigate("/dashboard")
    }

    return (
        <div className="page-layout"> {/* Mantiene la estructura base del layout */}
            <main className="page-main-content"> {/* Empuja el footer hacia abajo */}
                <div className="login-container">
                    <h1>Oubaitori</h1>
                    <h2>Crear cuenta</h2>

                    <form onSubmit={handleSubmit} className="login-form">
                        <input
                            type="text"
                            placeholder="Nombre completo"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                        />

                        <input
                            type="email"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && <p className="error">{error}</p>}

                        <button type="submit" className="rpg-button">Registrarme</button>
                    </form>

                    <p className="registro-link">
                        ¿Ya tienes cuenta? <a href="/">Inicia sesión</a>
                    </p>
                </div>
            </main>
        </div>
    )
}